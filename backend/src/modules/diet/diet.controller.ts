import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DietService } from './diet.service';
import { VerifyFoodsDto } from './dto/verify-foods.dto';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('diet')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class DietController {
  constructor(private readonly dietService: DietService) {}

  @Post('verify-foods')
  async verifyFoods(@Request() req: any, @Body() body: VerifyFoodsDto) {
    return this.dietService.verifyFoodsAgainstRestrictions(req.user.id, body);
  }
}
