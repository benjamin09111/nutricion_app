import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@Controller('foods')
export class FoodsController {
    constructor(private readonly foodsService: FoodsService) { }

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
        @Query('tab') tab?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.foodsService.findAll({
            nutritionistAccountId: req.user.id,
            search,
            category,
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
        @Body() data: {
            isFavorite?: boolean;
            isNotRecommended?: boolean;
            isHidden?: boolean;
            tags?: string[];
        }
    ) {
        return this.foodsService.togglePreference(id, req.user.id, data);
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
