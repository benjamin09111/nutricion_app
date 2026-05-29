import { Module } from '@nestjs/common';
import { PautasController } from './pautas.controller';
import { PautasService } from './pautas.service';
import { AiService } from '../../common/services/ai.service';

@Module({
  controllers: [PautasController],
  providers: [PautasService, AiService],
})
export class PautasModule {}
