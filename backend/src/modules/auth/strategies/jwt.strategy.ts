import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Request } from 'express';
import {
  AUTH_SESSION_COOKIE,
  LEGACY_AUTH_SESSION_COOKIE,
} from '../auth-cookie.constants';

const extractTokenFromCookie = (request: Request) => {
  const cookieHeader = request.headers.cookie || '';
  for (const cookieName of [
    AUTH_SESSION_COOKIE,
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
      audience:
        configService.get<string>('JWT_AUDIENCE') || 'nutrinet-app',
    });
  }

  async validate(payload: any) {
    // Verify the account still exists and is active in the database
    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      select: {
        status: true,
        role: true,
        email: true,
        rut: true,
        lastLoginAt: true,
        nutritionist: {
          select: { id: true },
        },
      },
    });

    if (
      !account ||
      account.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Sesión inválida');
    }

    if (
      account.lastLoginAt &&
      typeof payload?.iat === 'number' &&
      Math.floor(account.lastLoginAt.getTime() / 1000) > payload.iat
    ) {
      throw new UnauthorizedException(
        `Su plan ha sido actualizado ${payload.email}, por favor, vuelva a iniciar sesión por seguridad.`,
      );
    }

    return {
      id: payload.sub,
      email: account.email,
      role: account.role,
      rut: account.rut,
      nutritionistId: account.nutritionist?.id,
    };
  }
}
