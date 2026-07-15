import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  LEGACY_PATIENT_PORTAL_SESSION_COOKIE,
  PATIENT_PORTAL_SESSION_COOKIE,
} from '../patient-portal-cookie.constants';

const readCookie = (cookieHeader: string, name: string) => {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

@Injectable()
export class PatientPortalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization || '';
    const cookieHeader = request.headers?.cookie || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : readCookie(cookieHeader, PATIENT_PORTAL_SESSION_COOKIE) ||
        readCookie(cookieHeader, LEGACY_PATIENT_PORTAL_SESSION_COOKIE);

    if (!token) {
      throw new UnauthorizedException('No hay sesión de portal activa');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          this.configService.get<string>('PORTAL_JWT_SECRET') ||
          this.configService.get<string>('JWT_SECRET') ||
          'secret',
      });

      if (
        payload?.kind !== 'patient-portal' ||
        !payload?.patientId ||
        !payload?.nutritionistId
      ) {
        throw new UnauthorizedException('Token de portal inválido');
      }

      const invitation = await this.prisma.patientPortalInvitation.findUnique({
        where: { id: payload.invitationId },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          revokedAt: true,
          blockedAt: true,
          patientId: true,
          nutritionistId: true,
        },
      });

      if (
        !invitation ||
        invitation.patientId !== payload.patientId ||
        invitation.nutritionistId !== payload.nutritionistId ||
        invitation.status !== 'ACTIVE' ||
        invitation.revokedAt ||
        invitation.blockedAt
      ) {
        throw new UnauthorizedException(
          'El acceso del portal está bloqueado o expiró',
        );
      }

      request.portalSession = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        'La sesión del portal expiró o es inválida',
      );
    }
  }
}
