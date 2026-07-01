import { Module } from '@nestjs/common';
import { PatientIntakeService } from './patient-intake.service';
import { PatientIntakeController } from './patient-intake.controller';
import { PublicPatientIntakeController } from './public-patient-intake.controller';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PatientsModule],
  controllers: [PatientIntakeController, PublicPatientIntakeController],
  providers: [PatientIntakeService],
  exports: [PatientIntakeService],
})
export class PatientIntakeModule {}
