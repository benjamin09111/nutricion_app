import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { FlowService } from './flow.service';

@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly flowService: FlowService) {}

  @Post('flow/confirmation')
  @HttpCode(HttpStatus.OK)
  async handleFlowConfirmation(@Req() req: Request) {
    const token = req.body?.token;
    try {
      const result = await this.flowService.handlePaymentConfirmation(token);
      return result;
    } catch (error) {
      this.logger.error('Flow confirmation processing failed', error);
      return { message: 'Error al procesar confirmación Flow' };
    }
  }
}
