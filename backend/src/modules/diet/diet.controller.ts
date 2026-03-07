import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DietService } from './diet.service';
import { VerifyFoodsDto } from './dto/verify-foods.dto';

@Controller('diet')
@UseGuards(AuthGuard)
export class DietController {
  constructor(private readonly dietService: DietService) {}

  @Post('verify-foods')
  async verifyFoods(@Body() body: VerifyFoodsDto) {
    return this.dietService.verifyFoodsAgainstRestrictions(body);
  }
}
