import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientPortalsController } from './patient-portals.controller';
import { PatientPortalsService } from './patient-portals.service';
import { PatientPortalAuthGuard } from './guards/patient-portal.guard';
import {
  portalCodeRotationLimiter,
  portalInvitationVerifyLimiter,
  portalLoginLimiter,
} from './patient-portal-rate-limit.middleware';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AppointmentsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('PORTAL_JWT_SECRET'),
      }),
    }),
  ],
  controllers: [PatientPortalsController],
  providers: [PatientPortalsService, PatientPortalAuthGuard],
  exports: [PatientPortalsService],
})
export class PatientPortalsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(portalLoginLimiter).forRoutes({
      path: 'patient-portals/login',
      method: RequestMethod.POST,
    });
    consumer.apply(portalInvitationVerifyLimiter).forRoutes({
      path: 'patient-portals/invitations/:token/verify',
      method: RequestMethod.POST,
    });
    consumer.apply(portalCodeRotationLimiter).forRoutes({
      path: 'patient-portals/patients/:patientId/access-code/rotate',
      method: RequestMethod.POST,
    });
  }
}
