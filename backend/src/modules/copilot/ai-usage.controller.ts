import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common';
import { AiUsageService, AiUsageFilterQuery } from './ai-usage.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { UserRole } from '@prisma/client';

@Controller('admin/ai-usage')
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.ADMIN_MASTER,
  UserRole.ADMIN_GENERAL,
  UserRole.NUTRITIONIST_DEVELOPER,
)
export class AiUsageController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  @Get('stats')
  async getStats(@Query() query: AiUsageFilterQuery) {
    return this.aiUsageService.getStats(query);
  }

  @Get('logs')
  async getLogs(@Query() query: AiUsageFilterQuery) {
    return this.aiUsageService.getLogs(query);
  }

  @Post('cleanup')
  async cleanOldLogs() {
    const deletedCount = await this.aiUsageService.cleanOldLogs();
    return { success: true, deletedCount };
  }
}
