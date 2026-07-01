import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

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
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

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
        invitation.blockedAt ||
        invitation.expiresAt.getTime() < Date.now()
      ) {
        throw new UnauthorizedException(
          'El acceso del portal está bloqueado o expiró',
        );
      }

      request.portalSession = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'La sesión del portal expiró o es inválida',
      );
    }
  }
}
