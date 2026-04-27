import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { PatientPortalsController } from './patient-portals.controller';
import { PatientPortalsService } from './patient-portals.service';
import { PatientPortalAuthGuard } from './guards/patient-portal.guard';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('PORTAL_JWT_SECRET') || configService.get<string>('JWT_SECRET') || 'secret',
      }),
    }),
  ],
  controllers: [PatientPortalsController],
  providers: [PatientPortalsService, PatientPortalAuthGuard],
  exports: [PatientPortalsService],
})
export class PatientPortalsModule {}
