import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    getStats(@Request() req: any) {
        return this.dashboardService.getNutritionistStats(req.user.nutritionistId);
    }
}
