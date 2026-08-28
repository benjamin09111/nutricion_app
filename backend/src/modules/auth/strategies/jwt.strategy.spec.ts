import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

/**
 * Invariante de seguridad: el rol SIEMPRE se resuelve desde la base de datos.
 * Un token con `role` manipulado a mano no debe otorgar privilegios.
 */
describe('JwtStrategy', () => {
  const config = {
    get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
  } as unknown as ConfigService;

  const buildStrategy = (account: any) => {
    const prisma = {
      account: { findUnique: jest.fn().mockResolvedValue(account) },
    } as any;
    return { strategy: new JwtStrategy(config, prisma), prisma };
  };

  it('ignora el claim `role` del token y usa el de la base de datos', async () => {
    const { strategy, prisma } = buildStrategy({
      status: 'ACTIVE',
      role: 'NUTRITIONIST',
      email: 'nutri@nutrinet.cl',
      rut: '11111111-1',
      lastLoginAt: null,
      tokenVersion: 3,
      nutritionist: { id: 'nutri-1' },
    });

    const user = await strategy.validate({
      sub: 'account-1',
      email: 'atacante@nutrinet.cl',
      role: 'ADMIN_MASTER',
      nutritionistId: 'otro-id',
      tokenVersion: 3,
    });

    expect(user.role).toBe('NUTRITIONIST');
    expect(user.email).toBe('nutri@nutrinet.cl');
    expect(user.nutritionistId).toBe('nutri-1');
    expect(prisma.account.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'account-1' } }),
    );
  });

  it('rechaza tokens sin `sub`', async () => {
    const { strategy } = buildStrategy(null);

    await expect(strategy.validate({ role: 'ADMIN_MASTER' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza cuentas inactivas aunque el token sea válido', async () => {
    const { strategy } = buildStrategy({
      status: 'SUSPENDED',
      role: 'ADMIN_MASTER',
      email: 'admin@nutrinet.cl',
      rut: null,
      lastLoginAt: null,
      nutritionist: null,
    });

    await expect(
      strategy.validate({ sub: 'account-1', role: 'ADMIN_MASTER' }),
    ).rejects.toThrow(UnauthorizedException);
  });
  /**
   * El claim `tokenVersion` es obligatorio. Si se tratara como opcional, un
   * token emitido sin él quedaría permanentemente fuera del mecanismo de
   * revocación instantánea (era el caso del login con Google).
   */
  it('rechaza tokens sin el claim `tokenVersion`', async () => {
    const { strategy } = buildStrategy({
      status: 'ACTIVE',
      role: 'NUTRITIONIST',
      email: 'nutri@nutrinet.cl',
      rut: '11111111-1',
      lastLoginAt: null,
      tokenVersion: 0,
      nutritionist: { id: 'nutri-1' },
    });

    await expect(
      strategy.validate({ sub: 'account-1', email: 'nutri@nutrinet.cl' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza tokens con un `tokenVersion` desactualizado', async () => {
    const { strategy } = buildStrategy({
      status: 'ACTIVE',
      role: 'NUTRITIONIST',
      email: 'nutri@nutrinet.cl',
      rut: '11111111-1',
      lastLoginAt: null,
      tokenVersion: 5,
      nutritionist: { id: 'nutri-1' },
    });

    await expect(
      strategy.validate({ sub: 'account-1', tokenVersion: 4 }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
