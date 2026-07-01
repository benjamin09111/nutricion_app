import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FlowService } from './flow.service';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { isAdminRole } from '../permissions/permissions.constants';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly flowService: FlowService,
    private readonly discountCodesService: DiscountCodesService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException('Solo administradores pueden ver pagos');
    }
    return this.paymentsService.findAll();
  }

  @Get('recent')
  findRecent(@Query('limit') limit: string, @Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException('Solo administradores pueden ver pagos');
    }
    return this.paymentsService.findRecent(limit ? parseInt(limit) : 5);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException(
        'Solo administradores pueden ver estadísticas',
      );
    }
    return this.paymentsService.getRevenueStats();
  }

  // ─── Membership Status ─────────────────────────────────────────────

  @Get('membership-status')
  async getMembershipStatus(@Request() req: any) {
    const accountId = req.user?.id;
    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }
    return this.paymentsService.getMembershipStatus(accountId);
  }

  // ─── Select Free Plan ──────────────────────────────────────────────

  @Post('select-free-plan')
  async selectFreePlan(@Body() body: { planId: string }, @Request() req: any) {
    const accountId = req.user?.id;
    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }
    return this.paymentsService.selectFreePlan(accountId, body.planId);
  }

  // ─── Membership Checkout ───────────────────────────────────────────

  @Post('membership-checkout')
  async membershipCheckout(
    @Body() body: { planId: string },
    @Request() req: any,
  ) {
    const accountId = req.user?.id;

    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return this.paymentsService.membershipCheckout(accountId, body.planId);
  }

  // ─── Cancel / Resume ───────────────────────────────────────────────

  @Post('membership/cancel')
  async cancelMembership(@Request() req: any) {
    const accountId = req.user?.id;
    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }
    return this.paymentsService.cancelSubscription(accountId);
  }

  @Post('membership/resume')
  async resumeMembership(@Request() req: any) {
    const accountId = req.user?.id;
    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }
    return this.paymentsService.resumeSubscription(accountId);
  }

  // ─── Flow Checkout ─────────────────────────────────────────────────

  @Post('flow/checkout')
  async createFlowCheckout(
    @Body() body: { planId: string; returnPath?: string },
    @Request() req: any,
  ) {
    const accountId = req.user?.id;
    const payerEmail = req.user?.email;

    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return this.flowService.createMembershipCheckout(
      accountId,
      body.planId,
      payerEmail,
      undefined,
      body.returnPath,
    );
  }

  // ─── Discount Validation ─────────────────────────────────────────

  @Post('validate-discount')
  async validateDiscount(
    @Body() body: { code: string; planId: string },
    @Request() req: any,
  ) {
    const accountId = req.user?.id;
    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }
    return this.paymentsService.validateDiscount(
      accountId,
      body.planId,
      body.code,
    );
  }

  // ─── Flow Checkout with Discount ─────────────────────────────────

  @Post('flow/discount-checkout')
  async createFlowDiscountCheckout(
    @Body() body: { planId: string; discountCode?: string; returnPath?: string },
    @Request() req: any,
  ) {
    const accountId = req.user?.id;
    const payerEmail = req.user?.email;

    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return this.flowService.createMembershipCheckout(
      accountId,
      body.planId,
      payerEmail,
      body.discountCode || undefined,
      body.returnPath,
    );
  }

  @Post('dev/change-plan')
  async devChangePlan(@Body() body: { planId: string }, @Request() req: any) {
    const accountId = req.user?.id;

    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return this.paymentsService.devSwitchPlan(accountId, body.planId);
  }

  // ─── Simulate Payment (Admin Only) ─────────────────────────────────

  @Post('simulate')
  async simulate(
    @Body()
    body: { userId: string; planId: string; amount?: number; method: string },
    @Request() req: any,
  ) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException(
        'Solo administradores pueden simular pagos',
      );
    }

    return this.paymentsService.simulatePayment({
      userId: body.userId,
      planId: body.planId,
      amount: body.amount,
      method: body.method as any,
    });
  }
}
