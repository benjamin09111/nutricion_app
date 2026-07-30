import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Request } from 'express';
import {
  AUTH_SESSION_COOKIE,
  LEGACY_AUTH_SESSION_COOKIE,
  LEGACY_NUTRINET_SESSION_COOKIE,
} from '../auth-cookie.constants';

const extractTokenFromCookie = (request: Request) => {
  const cookieHeader = request.headers.cookie || '';
  // Check current unified cookie first, then legacy names for backward compat
  for (const cookieName of [
    AUTH_SESSION_COOKIE,
    LEGACY_NUTRINET_SESSION_COOKIE,
    LEGACY_AUTH_SESSION_COOKIE,
  ]) {
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`),
    );
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractTokenFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      issuer: configService.get<string>('JWT_ISSUER') || 'nutrinet-api',
      audience: configService.get<string>('JWT_AUDIENCE') || 'nutrinet-app',
    });
  }

  async validate(payload: any) {
    // IMPORTANTE (seguridad): del token sólo se usa `sub` (id de cuenta) e `iat`.
    // Cualquier otro claim (role, nutritionistId, email...) que venga dentro del
    // JWT se ignora deliberadamente. El rol y los permisos se leen SIEMPRE desde
    // la base de datos, por lo que editar el token a mano no otorga privilegios.
    const accountId = typeof payload?.sub === 'string' ? payload.sub : null;
    if (!accountId) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Verify the account still exists and is active in the database
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        status: true,
        role: true,
        email: true,
        rut: true,
        nutritionist: {
          select: { id: true },
        },
      },
    });

    if (!account || account.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sesión inválida');
    }

    return {
      id: accountId,
      email: account.email,
      // Rol autoritativo: viene de la BD, no del JWT.
      role: account.role,
      rut: account.rut,
      nutritionistId: account.nutritionist?.id,
    };
  }
}
