import { Controller, Post, Body } from '@nestjs/common';
import { CalculationsService, CalculationInputs } from './calculations.service';

@Controller('calculations')
export class CalculationsController {
  constructor(private readonly calculationsService: CalculationsService) {}

  @Post('calculate')
  calculate(@Body() inputs: any) {
    return this.calculationsService.calculateAll(inputs as CalculationInputs);
  }
}
