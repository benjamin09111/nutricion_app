import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AppointmentsPublicController } from './appointments.public.controller';
import { AppointmentsRecordsController } from './appointments.records.controller';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [
    AppointmentsController,
    AppointmentsPublicController,
    AppointmentsRecordsController,
  ],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
