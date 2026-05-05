import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NutritionistsController } from './nutritionists.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [UsersController, NutritionistsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
