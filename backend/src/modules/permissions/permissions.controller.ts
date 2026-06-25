import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PlanUsageService } from './plan-usage.service';

@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(private readonly planUsageService: PlanUsageService) {}

  @Post('consume')
  consume(
    @Request() req: any,
    @Body() body: { featureKey: string; amount?: number },
  ) {
    return this.planUsageService.consumeMonthlyQuota(
      req.user.id,
      body.featureKey,
      body.amount || 1,
    );
  }
}
