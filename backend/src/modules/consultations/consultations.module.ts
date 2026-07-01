import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';

import { PrismaModule } from '../../prisma/prisma.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PrismaModule, PatientsModule],
  providers: [ConsultationsService],
  controllers: [ConsultationsController],
})
export class ConsultationsModule {}
