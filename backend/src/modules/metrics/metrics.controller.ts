import { Controller, Get, Post, Body, Query, UseGuards, Delete, Param, UseInterceptors, Request } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('metrics')
@UseGuards(AuthGuard)
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get()
    async findAll(@Query('search') search?: string) {
        if (search) {
            return this.metricsService.search(search);
        }
        return this.metricsService.findAll();
    }

    @Post()
    async create(
        @Body() data: { name: string; unit: string; key: string; icon?: string; color?: string },
        @Request() req: any
    ) {
        const nutritionistId = req.user.nutritionistId;
        return this.metricsService.findOrCreate(data, nutritionistId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const nutritionistId = req.user.nutritionistId;
        const role = req.user.role;
        return this.metricsService.remove(id, nutritionistId, role);
    }
}
