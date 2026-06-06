import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SubstitutesService } from './substitutes.service';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('substitutes')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class SubstitutesController {
  constructor(private readonly substitutesService: SubstitutesService) {}

  @Get()
  async findOne(@Request() req: any) {
    const nutritionistId = req.user.nutritionistId;
    return this.substitutesService.findByNutritionist(nutritionistId);
  }

  @Post()
  async upsert(@Request() req: any, @Body() body: { content: any }) {
    const nutritionistId = req.user.nutritionistId;
    return this.substitutesService.upsert(nutritionistId, body.content);
  }
}
