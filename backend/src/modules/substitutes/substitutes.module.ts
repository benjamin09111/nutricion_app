import { Module } from '@nestjs/common';
import { SubstitutesService } from './substitutes.service';
import { SubstitutesController } from './substitutes.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SubstitutesService],
  controllers: [SubstitutesController]
})
export class SubstitutesModule { }
