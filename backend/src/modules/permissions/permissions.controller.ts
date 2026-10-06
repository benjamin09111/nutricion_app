import {
  BadRequestException,
  ForbiddenException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PlanUsageService } from './plan-usage.service';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { isAdminRole } from './permissions.constants';

@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(private readonly planUsageService: PlanUsageService) {}

  @Post('consume')
  consume(
    @Request() req: any,
    @Body() body: { featureKey: string; amount?: number; dedupeKey?: string },
  ) {
    if (
      body.featureKey !== PLAN_ENTITLEMENT_KEYS.PDF_EXPORTS_TOTAL_LIMIT ||
      (body.amount !== undefined && body.amount !== 1)
    ) {
      throw new BadRequestException('Operación de cuota no permitida');
    }

    return this.planUsageService.consumeQuota(
      req.user.id,
      body.featureKey,
      1,
      'lifetime',
      body.dedupeKey,
    );
  }

  @Post('reset-pdf-dev')
  async resetPdfDev(@Request() req: any) {
    if (process.env.NODE_ENV === 'production' || !isAdminRole(req.user?.role)) {
      throw new ForbiddenException('Operación no permitida');
    }

    await this.planUsageService.resetPdfQuota(req.user.id);
    return { success: true, message: 'Cuota de PDFs reiniciada a 0' };
  }

  @Post('reset-ai-dev')
  async resetAiDev(@Request() req: any) {
    if (process.env.NODE_ENV === 'production' || !isAdminRole(req.user?.role)) {
      throw new ForbiddenException('Operación no permitida');
    }

    await this.planUsageService.resetAiQuota(req.user.id);
    return { success: true, message: 'Cuota de IA reiniciada a 0' };
  }
}
