import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { TagsModule } from '../tags/tags.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CalculationsModule } from '../calculations/calculations.module';

@Module({
  imports: [
    PrismaModule,
    TagsModule,
    MetricsModule,
    PermissionsModule,
    CalculationsModule,
  ],
  providers: [PatientsService],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
