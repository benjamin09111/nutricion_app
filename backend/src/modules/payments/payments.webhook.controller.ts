import {
  Controller,
  Post,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FlowService } from './flow.service';
import { resolveSafeRelativePath } from '../../common/utils/safe-redirect.util';

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
  handleFlowReturn(@Res() res: Response, @Query('path') path: string) {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL no está configurada',
      );
    }

    // `path` viaja en la URL de retorno de Flow, así que se trata como entrada
    // no confiable: se fuerza a ser un path relativo de este mismo sitio.
    const safePath = resolveSafeRelativePath(path, '/');

    // Add payment=pending if not already present
    const separator = safePath.includes('?') ? '&' : '?';
    const returnPath = `${safePath}${separator}payment=pending`;

    const redirectUrl = `${frontendUrl.replace(/\/$/, '')}${returnPath}`;

    return res.redirect(HttpStatus.FOUND, redirectUrl);
  }
}
