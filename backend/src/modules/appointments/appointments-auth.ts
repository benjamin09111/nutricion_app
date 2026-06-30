import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AppointmentRequest,
  NutritionistJwtPayload,
} from './appointments.types';

const readHeader = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

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

export async function resolveNutritionistIdFromRequest(
  request: AppointmentRequest,
  prisma: PrismaService,
): Promise<string> {
  const headerId = readHeader(request.headers['x-nutritionist-id']);
  const apiKey = readHeader(request.headers['x-api-key']);
  const authHeader = readHeader(request.headers['authorization']);

  if (headerId && apiKey && apiKey === process.env.APPOINTMENTS_API_KEY) {
    const headerNutritionist = await prisma.nutritionist.findUnique({
      where: { id: headerId },
      select: { id: true },
    });

    if (headerNutritionist?.id) {
      return headerNutritionist.id;
    }
  }

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new Error('JWT secret not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as NutritionistJwtPayload;

      if (decoded?.sub) {
        const account = await prisma.account.findUnique({
          where: { id: decoded.sub },
          include: { nutritionist: true },
        });

        if (account?.nutritionist?.id) {
          return account.nutritionist.id;
        }

        const nutritionist = await prisma.nutritionist.findUnique({
          where: { accountId: decoded.sub },
          select: { id: true },
        });

        if (nutritionist?.id) {
          return nutritionist.id;
        }

        if (
          account &&
          (account.role === 'NUTRITIONIST' ||
            account.role === 'NUTRITIONIST_DEVELOPER')
        ) {
          const createdNutritionist = await prisma.nutritionist.create({
            data: {
              accountId: account.id,
              fullName: account.email.split('@')[0] || 'Nutricionista',
              publicSlug: buildNutritionistSlug(account.id, account.email),
            },
            select: { id: true },
          });

          return createdNutritionist.id;
        }
      }
    } catch {
      // Invalid JWTs fall back to the explicit nutritionist header.
    }
  }

  throw new Error('No se pudo identificar al nutricionista');
}
