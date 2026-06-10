import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';

@Controller('ingredient-groups')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(PLAN_ENTITLEMENT_KEYS.FOOD_GROUPS_ACCESS)
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(300000) // 5 minutes
export class IngredientGroupsController {
  constructor(
    private readonly ingredientGroupsService: IngredientGroupsService,
  ) {}

  @Post()
  create(@Request() req: any, @Body() createDto: CreateIngredientGroupDto) {
    return this.ingredientGroupsService.create(
      req.user.nutritionistId,
      createDto,
    );
  }

  @Get()
  findAll(@Request() req: any, @Query('type') type?: string) {
    return this.ingredientGroupsService.findAll(req.user.nutritionistId, type);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.ingredientGroupsService.findOne(id, req.user.nutritionistId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: CreateIngredientGroupDto,
  ) {
    return this.ingredientGroupsService.update(
      id,
      req.user.nutritionistId,
      updateDto,
    );
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.ingredientGroupsService.remove(id, req.user.nutritionistId);
  }

  @Post(':id/ingredients')
  addIngredients(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateGroupIngredientsDto,
  ) {
    return this.ingredientGroupsService.addIngredients(
      id,
      req.user.nutritionistId,
      dto,
    );
  }

  @Delete(':id/ingredients')
  removeIngredients(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateGroupIngredientsDto,
  ) {
    return this.ingredientGroupsService.removeIngredients(
      id,
      req.user.nutritionistId,
      dto,
    );
  }
}
