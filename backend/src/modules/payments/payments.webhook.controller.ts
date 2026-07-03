import {
  Controller,
  Post,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
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

  @Post('flow/return')
  async handleFlowReturn(
    @Req() req: Request,
    @Res() res: Response,
    @Query('path') path: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Add payment=pending if not already present
    const separator = path?.includes('?') ? '&' : '?';
    const returnPath = path
      ? `${path}${separator}payment=pending`
      : `/?payment=pending`;

    const redirectUrl = `${frontendUrl.replace(/\/$/, '')}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`;

    return res.redirect(HttpStatus.FOUND, redirectUrl);
  }
}
