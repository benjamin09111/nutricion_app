import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Delete,
  Param,
  Request,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { PermissionsService } from '../permissions/permissions.service';
import { NutritionistScopeGuard } from '../../common/guards/nutritionist-scope.guard';

@Controller('tags')
@UseGuards(AuthGuard, NutritionistScopeGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    if (search) {
      return this.tagsService.search(search);
    }
    return this.tagsService.findAll(limit ? parseInt(limit) : undefined);
  }

  @Post()
  async create(
    @Body('name') name: string,
    @Body('isClinicalRestriction') isClinicalRestriction: boolean,
    @Request() req: any,
  ) {
    if (isClinicalRestriction) {
      await this.permissionsService.ensureAccess(
        req.user.id,
        PLAN_ENTITLEMENT_KEYS.CLINICAL_RESTRICTIONS_CREATE_ACCESS,
      );
    } else {
      await this.permissionsService.ensureAccess(
        req.user.id,
        PLAN_ENTITLEMENT_KEYS.TAGS_CREATE_ACCESS,
      );
    }
    const nutritionistId = req.user.nutritionistId;
    return this.tagsService.findOrCreate(name, nutritionistId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const nutritionistId = req.user.nutritionistId;
    const role = req.user.role;
    return this.tagsService.remove(id, nutritionistId, role);
  }
}
