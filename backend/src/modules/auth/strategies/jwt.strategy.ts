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

    if (!account || account.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Plan changes update lastLoginAt so tokens issued before that action
    // cannot keep using stale permissions.
    if (
      account.lastLoginAt &&
      payload.iat &&
      account.lastLoginAt.getTime() > payload.iat * 1000 + 1000
    ) {
      throw new UnauthorizedException('Sesión desactualizada por cambio de plan');
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
