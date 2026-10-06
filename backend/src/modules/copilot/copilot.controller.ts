import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Logger,
  HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { CopilotService } from './copilot.service';
import { CopilotMessageDto } from './dto/copilot-message.dto';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { PlanUsageService } from '../permissions/plan-usage.service';

@Controller('copilot')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequireFeatures(PLAN_ENTITLEMENT_KEYS.AI_AUTOFILL_ACCESS)
export class CopilotController {
  private readonly logger = new Logger(CopilotController.name);

  constructor(
    private readonly copilotService: CopilotService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  @Post('chat')
  async chat(
    @Body() body: CopilotMessageDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const accountId = req.user?.id || req.user?.sub;
    let quotaReserved = false;
    if (accountId) {
      try {
        await this.planUsageService.consumeQuota(
          accountId,
          PLAN_ENTITLEMENT_KEYS.AI_CALLS_LIMIT,
        );
        quotaReserved = true;
      } catch (error) {
        this.logger.warn(
          `Copilot quota consumption failed for account ${accountId}:`,
          error,
        );
        const message =
          error instanceof HttpException
            ? error.message
            : 'Has alcanzado el límite de consultas permitidas por tu plan o tu cuota no está disponible.';
        res.write(
          `data: ${JSON.stringify({ type: 'error', content: message })}\n\n`,
        );
        res.end();
        return;
      }
    }

    try {
      const result = await this.copilotService.chat(body.message, accountId);

      for await (const chunk of result.textStream) {
        res.write(
          `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`,
        );
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (error) {
      if (accountId && quotaReserved) {
        await this.planUsageService.refundQuota(
          accountId,
          PLAN_ENTITLEMENT_KEYS.AI_CALLS_LIMIT,
        );
      }
      this.logger.error('Error in Copilot chat:', error);
      const safeMessage =
        'No fue posible procesar tu consulta con el asistente en este momento. Intenta nuevamente más tarde.';
      res.write(
        `data: ${JSON.stringify({ type: 'error', content: safeMessage })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
