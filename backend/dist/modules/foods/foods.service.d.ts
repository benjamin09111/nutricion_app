import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketPriceDto } from './dto/market-price.dto';
import { CacheService } from '../../common/services/cache.service';
export declare class FoodsService {
    private readonly prisma;
    private readonly cacheService;
    constructor(prisma: PrismaService, cacheService: CacheService);
    private getOrCreateBrand;
    private getOrCreateCategory;
    private getOrCreateTags;
    create(createFoodDto: CreateFoodDto, userId: string): Promise<any>;
    findAll(params: {
        nutritionistAccountId?: string;
        search?: string;
        category?: string;
        tab?: string;
        page?: number;
        limit?: number;
    }): Promise<any>;
    togglePreference(ingredientId: string, userId: string, data: {
        isFavorite?: boolean;
        isNotRecommended?: boolean;
        isHidden?: boolean;
        tags?: string[];
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateFoodDto: UpdateFoodDto): Promise<any>;
    remove(id: string): Promise<any>;
    getMarketPrices(limit?: number): Promise<MarketPriceDto[]>;
}
