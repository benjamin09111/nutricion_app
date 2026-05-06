import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('foods')
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(3600000) // 1 hour for foods as they change less often
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createFoodDto: CreateFoodDto, @Request() req: any) {
    return this.foodsService.create(createFoodDto, req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('tab') tab?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodsService.findAll({
      nutritionistAccountId: req.user.id,
      search,
      category,
      tag,
      tab,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Patch(':id/preferences')
  @UseGuards(AuthGuard('jwt'))
  updatePreferences(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    data: {
      isFavorite?: boolean;
      isNotRecommended?: boolean;
      isHidden?: boolean;
      tags?: string[];
    },
  ) {
    return this.foodsService.togglePreference(id, req.user.id, data);
  }

  @Get('market-prices')
  getMarketPrices(@Query('limit') limit?: string) {
    return this.foodsService.getMarketPrices(limit ? Number(limit) : 7);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.foodsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() updateFoodDto: UpdateFoodDto,
    @Request() req: any,
  ) {
    return this.foodsService.update(id, updateFoodDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Request() req: any) {
    return this.foodsService.remove(id, req.user.id);
  }
}
