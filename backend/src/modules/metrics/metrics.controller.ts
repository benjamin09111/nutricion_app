import { Controller, Get, Post, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get('test')
    test() {
        return { status: 'ok', message: 'Metrics connectivity working' };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/dashboard')
    async getAdminDashboard(@Request() req: any) {
        try {
            if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
                throw new UnauthorizedException('Solo administradores pueden ver métricas');
            }
            return await this.metricsService.getAdminDashboardStats();
        } catch (error) {
            console.error('Error in getAdminDashboard controller:', error);
            throw error;
        }
    }

    // For manual testing (Dev only)
    @Post('force-calculate')
    async forceCalculate(@Request() req: any) {
        if (!['ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo Master Admin');
        }
        return this.metricsService.forceCalculate();
    }
}
