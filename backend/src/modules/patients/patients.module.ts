import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { TagsModule } from '../tags/tags.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [PrismaModule, TagsModule, MetricsModule],
  providers: [PatientsService],
  controllers: [PatientsController]
})
export class PatientsModule { }
