import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Request } from 'express';

const extractTokenFromCookie = (request: Request) => {
  const cookieHeader = request.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)auth_token_http=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
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
        nutritionist: {
          select: { id: true },
        },
      },
    });

    if (
      !account ||
      account.status === 'SUSPENDED' ||
      account.status === 'DELETED'
    ) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return {
      id: payload.sub,
      email: account.email,
      role: account.role,
      nutritionistId: account.nutritionist?.id,
    };
  }
}
