import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { MercadoPagoService } from './mercadopago.service';

@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly mercadopagoService: MercadoPagoService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request) {
    const body = req.body;

    if (!body || body.type !== 'payment') {
      return { message: 'Notificación ignorada' };
    }

    const isValid = this.mercadopagoService.verifyWebhookSignature(
      req.headers as Record<string, string>,
      body,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      return { message: 'Firma inválida' };
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return { message: 'ID de pago no encontrado' };
    }

    try {
      const result = await this.mercadopagoService.handleWebhook(paymentId);
      return result;
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      return { message: 'Error al procesar notificación' };
    }
  }
}
