import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import {
  credentialLoginLimiter,
  googleLoginLimiter,
  registrationLimiter,
  verificationLimiter,
} from './auth-rate-limit.middleware';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    MailModule,
    PermissionsModule,
    IntegrationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: (() => {
          const secret = configService.get<string>('JWT_SECRET');
          if (!secret) {
            throw new Error('JWT_SECRET is required');
          }
          return secret;
        })(),
        signOptions: {
          expiresIn: '7d',
          algorithm: 'HS256',
          issuer: configService.get<string>('JWT_ISSUER') || 'nutrinet-api',
          audience: configService.get<string>('JWT_AUDIENCE') || 'nutrinet-app',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(credentialLoginLimiter)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
    consumer
      .apply(registrationLimiter)
      .forRoutes({ path: 'auth/register', method: RequestMethod.POST });
    consumer.apply(verificationLimiter).forRoutes({
      path: 'auth/resend-verification',
      method: RequestMethod.POST,
    });
    consumer
      .apply(googleLoginLimiter)
      .forRoutes({ path: 'auth/google/start', method: RequestMethod.GET });
  }
}
