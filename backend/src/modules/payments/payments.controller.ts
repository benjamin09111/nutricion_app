import { Controller, Get, Post, Body, UseGuards, Query, Request, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get('recent')
    findRecent(@Query('limit') limit: string) {
        return this.paymentsService.findRecent(limit ? parseInt(limit) : 5);
    }

    @Get('stats')
    getStats() {
        return this.paymentsService.getRevenueStats();
    }
    @Post('simulate')
    async simulate(@Body() body: { userId: string; planId: string; amount?: number; method: string }, @Request() req: any) {
        // Enforce Admin Access
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo administradores pueden simular pagos');
        }

        return this.paymentsService.simulatePayment({
            userId: body.userId,
            planId: body.planId,
            amount: body.amount,
            method: body.method as any // Cast to PaymentMethod enum
        });
    }
}
