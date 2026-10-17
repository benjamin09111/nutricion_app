import { Module } from '@nestjs/common';
import { CalculationsService } from './calculations.service';
import { CalculationsController } from './calculations.controller';
import { ExchangePortionsService } from './exchange-portions.service';

@Module({
  controllers: [CalculationsController],
  providers: [CalculationsService, ExchangePortionsService],
  exports: [CalculationsService, ExchangePortionsService],
})
export class CalculationsModule {}
