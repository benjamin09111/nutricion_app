import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { PlanUsageService } from './plan-usage.service';
import { PermissionsController } from './permissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  controllers: [PermissionsController],
  imports: [PrismaModule],
  providers: [PermissionsService, PermissionsGuard, PlanUsageService],
  exports: [PermissionsService, PermissionsGuard, PlanUsageService],
})
export class PermissionsModule {}
