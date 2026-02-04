import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Controller('foods')
export class FoodsController {
    constructor(private readonly foodsService: FoodsService) { }

    @Post()
    create(@Body() createFoodDto: CreateFoodDto) {
        // TODO: Get nutritionistId from Request (AuthGuard)
        return this.foodsService.create(createFoodDto, undefined);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.foodsService.findAll({
            search,
            category,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Get('market-prices')
    getMarketPrices(@Query('limit') limit?: string) {
        return this.foodsService.getMarketPrices(limit ? Number(limit) : 7);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.foodsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateFoodDto: UpdateFoodDto) {
        return this.foodsService.update(id, updateFoodDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.foodsService.remove(id);
    }
}
