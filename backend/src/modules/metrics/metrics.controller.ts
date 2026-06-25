import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Delete,
  Param,
  Request,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('metrics')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    if (search) {
      return this.metricsService.search(search);
    }
    return this.metricsService.findAll();
  }

  @Post()
  async create(
    @Body()
    data: {
      name: string;
      unit: string;
      key: string;
      icon?: string;
      color?: string;
    },
    @Request() req: any,
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

  @Get('admin/dashboard')
  async getAdminDashboard(@Request() req: any) {
    return this.metricsService.getAdminDashboard(req.user.role);
  }

  @Post('force-calculate')
  async forceCalculate(@Request() req: any) {
    return this.metricsService.forceCalculateAdminMetrics(req.user.role);
  }
}
