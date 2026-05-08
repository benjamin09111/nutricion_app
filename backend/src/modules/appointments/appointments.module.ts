import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppointmentsPublicController } from './appointments.public.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController, AppointmentsPublicController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
