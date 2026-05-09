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

export async function resolveNutritionistIdFromRequest(
  request: AppointmentRequest,
  prisma: PrismaService,
): Promise<string> {
  const headerId = readHeader(request.headers['x-nutritionist-id']);
  const authHeader = readHeader(request.headers['authorization']);

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'change_me_local',
      ) as NutritionistJwtPayload;

      if (decoded?.sub) {
        const account = await prisma.account.findUnique({
          where: { id: decoded.sub },
          include: { nutritionist: true },
        });

        if (account?.nutritionist) {
          return account.nutritionist.id;
        }
      }
    } catch {
      // Invalid JWTs fall back to the explicit nutritionist header.
    }
  }

  if (headerId) {
    return headerId;
  }

  throw new Error('No se pudo identificar al nutricionista');
}
