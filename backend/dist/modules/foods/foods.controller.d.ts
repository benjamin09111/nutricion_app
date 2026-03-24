import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
export declare class FoodsController {
    private readonly foodsService;
    constructor(foodsService: FoodsService);
    create(createFoodDto: CreateFoodDto, req: any): Promise<any>;
    findAll(req: any, search?: string, category?: string, tab?: string, page?: string, limit?: string): Promise<any>;
    updatePreferences(id: string, req: any, data: {
        isFavorite?: boolean;
        isNotRecommended?: boolean;
        isHidden?: boolean;
        tags?: string[];
    }): Promise<any>;
    getMarketPrices(limit?: string): Promise<import("./dto/market-price.dto").MarketPriceDto[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateFoodDto: UpdateFoodDto): Promise<any>;
    remove(id: string): Promise<any>;
}
