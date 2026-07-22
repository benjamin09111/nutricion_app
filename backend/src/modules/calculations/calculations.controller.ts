import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CalculationsService, CalculationInputs } from './calculations.service';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { PlanUsageService } from '../permissions/plan-usage.service';

@Controller('calculations')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_ACCESS)
export class CalculationsController {
  constructor(
    private readonly calculationsService: CalculationsService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  @Post('calculate')
  async calculate(@Request() req: any, @Body() inputs: any) {
    await this.planUsageService.consumeQuota(
      req.user.id,
      PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_LIMIT,
    );
    return this.calculationsService.calculateAll(inputs as CalculationInputs);
  }
}
