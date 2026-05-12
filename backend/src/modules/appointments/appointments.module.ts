import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppointmentsPublicController } from './appointments.public.controller';
import { AppointmentsRecordsController } from './appointments.records.controller';
import { PublicAppointmentsController } from './public.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [
    AppointmentsController,
    AppointmentsPublicController,
    AppointmentsRecordsController,
    PublicAppointmentsController,
  ],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
