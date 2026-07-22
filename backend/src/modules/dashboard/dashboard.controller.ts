import {
  Controller,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DashboardService } from './dashboard.service';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('dashboard')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(600000) // 10 minutes for dashboard stats
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.dashboardService.getNutritionistStats(
      req.user.nutritionistId,
      req.user.id,
    );
  }
}
