import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: any) {
    // Verify the account still exists and is active in the database
    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      select: { status: true },
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
      email: payload.email,
      role: payload.role,
      nutritionistId: payload.nutritionistId,
    };
  }
}
