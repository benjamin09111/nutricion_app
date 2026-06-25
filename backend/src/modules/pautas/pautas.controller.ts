import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { PautasService } from './pautas.service';
import { AiGeneratePautasDto } from './dto/ai-generate-pautas.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('pautas')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class PautasController {
  constructor(private readonly pautasService: PautasService) {}

  @Post('ai-generate')
  async generateWithAi(@Request() req: any, @Body() dto: AiGeneratePautasDto) {
    const result = await this.pautasService.generateWithAi(req.user.id, dto);
    return result;
  }
}
