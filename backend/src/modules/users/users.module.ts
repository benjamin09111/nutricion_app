import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NutritionistsController } from './nutritionists.controller';
import {
  PublicNutritionistsController,
  PublicController,
} from './public-nutritionists.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [PrismaModule, MailModule, AppointmentsModule],
  controllers: [
    UsersController,
    NutritionistsController,
    PublicNutritionistsController,
    PublicController,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
