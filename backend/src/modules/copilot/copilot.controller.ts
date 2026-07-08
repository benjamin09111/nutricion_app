import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
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
  constructor(
    private readonly copilotService: CopilotService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  @Post('chat')
  async chat(@Body() body: CopilotMessageDto, @Request() req: any, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const accountId = req.user?.id || req.user?.sub;
    if (accountId) {
      try {
        await this.planUsageService.consumeMonthlyQuota(
          accountId,
          PLAN_ENTITLEMENT_KEYS.AI_CALLS_LIMIT,
          1,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Cuota agotada';
        res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
        res.end();
        return;
      }
    }

    try {
      const result = await this.copilotService.chat(body.message);

      for await (const chunk of result.textStream) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
