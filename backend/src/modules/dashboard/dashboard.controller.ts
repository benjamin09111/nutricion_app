import { Controller, Get, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(600000) // 10 minutes for dashboard stats
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    getStats(@Request() req: any) {
        return this.dashboardService.getNutritionistStats(req.user.nutritionistId);
    }
}
