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
import { MercadoPagoService } from './mercadopago.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mercadopagoService: MercadoPagoService,
  ) {}

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

  @Post('create-preference')
  async createPreference(
    @Body() dto: CreatePreferenceDto,
    @Request() req: any,
  ) {
    const accountId = req.user?.id;
    const payerEmail = req.user?.email;

    if (!accountId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return this.mercadopagoService.createPreference(
      dto,
      accountId,
      payerEmail,
    );
  }

  @Post('simulate')
  async simulate(
    @Body()
    body: { userId: string; planId: string; amount?: number; method: string },
    @Request() req: any,
  ) {
    if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
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
