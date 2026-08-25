import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { NutritionistScopeGuard } from './nutritionist-scope.guard';

const contextFor = (user: unknown) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('NutritionistScopeGuard', () => {
  const guard = new NutritionistScopeGuard();

  it('deja pasar a un nutricionista con perfil', () => {
    expect(
      guard.canActivate(contextFor({ id: 'acc-1', nutritionistId: 'nut-1' })),
    ).toBe(true);
  });

  // Regresión: Prisma ignora las claves `undefined` dentro de un `where`, así
  // que `where: { id, nutritionistId: undefined }` degrada a `where: { id }` y
  // devuelve el recurso de cualquier otro nutricionista.
  it.each([
    ['sin nutritionistId', { id: 'acc-1' }],
    [
      'con nutritionistId undefined',
      { id: 'acc-1', nutritionistId: undefined },
    ],
    ['con nutritionistId vacío', { id: 'acc-1', nutritionistId: '' }],
    ['con nutritionistId no string', { id: 'acc-1', nutritionistId: 42 }],
    ['cuenta de personal interno', { id: 'acc-1', role: 'ADMIN' }],
    ['sin usuario', undefined],
  ])('rechaza la petición %s', (_caso, user) => {
    expect(() => guard.canActivate(contextFor(user))).toThrow(
      ForbiddenException,
    );
  });
});
