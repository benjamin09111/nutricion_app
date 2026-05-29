import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PautasService } from './pautas.service';
import { AiGeneratePautasDto } from './dto/ai-generate-pautas.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('pautas')
@UseGuards(AuthGuard)
export class PautasController {
  constructor(private readonly pautasService: PautasService) {}

  @Post('ai-generate')
  async generateWithAi(@Body() dto: AiGeneratePautasDto) {
    const result = await this.pautasService.generateWithAi(dto);
    return result;
  }
}
