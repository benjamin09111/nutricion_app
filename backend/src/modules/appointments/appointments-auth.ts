import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentRequest } from './appointments.types';

const buildNutritionistSlug = (accountId: string, email?: string | null) => {
  const base = (email || 'nutricionista')
    .split('@')[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${base || 'nutricionista'}-${accountId.slice(0, 8)}`;
};

/**
 * Resuelve el nutricionista dueño de la petición.
 *
 * SEGURIDAD: la identidad sale EXCLUSIVAMENTE de `request.user`, que rellena
 * `JwtStrategy` leyendo la cuenta desde la base de datos. Las cabeceras
 * `x-nutritionist-id` y `x-api-key` que se aceptaban antes quedaron eliminadas:
 * permitían indicar la agenda de cualquier otro nutricionista con un único
 * secreto compartido, y ahora se ignoran por completo aunque lleguen.
 */
export async function resolveNutritionistIdFromRequest(
  request: AppointmentRequest,
  prisma: PrismaService,
): Promise<string> {
  const user = (request as any).user as
    | { id?: string; role?: string; nutritionistId?: string }
    | undefined;

  const accountId = user?.id;
  if (!accountId) {
    throw new ForbiddenException('No se pudo identificar al nutricionista');
  }

  if (user?.nutritionistId) {
    return user.nutritionistId;
  }

  // La cuenta es de nutricionista pero aún no tiene ficha creada (puede pasar en
  // cuentas antiguas o creadas por un administrador). Se crea al vuelo.
  if (user.role === 'NUTRITIONIST' || user.role === 'NUTRITIONIST_DEVELOPER') {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, email: true },
    });

    if (account) {
      const created = await prisma.nutritionist.create({
        data: {
          accountId: account.id,
          fullName: account.email.split('@')[0] || 'Nutricionista',
          publicSlug: buildNutritionistSlug(account.id, account.email),
        },
        select: { id: true },
      });

      return created.id;
    }
  }

  throw new ForbiddenException(
    'Esta sección es exclusiva de cuentas de nutricionista con perfil activo.',
  );
}
