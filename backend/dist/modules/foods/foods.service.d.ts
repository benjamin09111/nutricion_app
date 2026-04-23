import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketPriceDto } from './dto/market-price.dto';
import { CacheService } from '../../common/services/cache.service';
export declare class FoodsService {
    private readonly prisma;
    private readonly cacheService;
    private readonly draftMarker;
    private readonly logger;
    constructor(prisma: PrismaService, cacheService: CacheService);
    private normalizeText;
    private parseDraftIngredientField;
    private buildDraftIngredientField;
    private buildNonDraftWhere;
    private resolveIngredientNotesForWrite;
    private serializeIngredient;
    private resolveNutritionist;
    private findIngredientWithRelations;
    private assertIngredientOwnership;
    private getOrCreateBrand;
    private getOrCreateCategory;
    private getOrCreateTags;
    private findDuplicateIngredient;
    private invalidateFoodCaches;
    create(createFoodDto: CreateFoodDto, userId: string): Promise<any>;
    findAll(params: {
        nutritionistAccountId?: string;
        search?: string;
        category?: string;
        tag?: string;
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
    findOne(id: string, requesterAccountId: string): Promise<any>;
    update(id: string, updateFoodDto: UpdateFoodDto, requesterAccountId: string): Promise<any>;
    remove(id: string, requesterAccountId: string): Promise<any>;
    getMarketPrices(limit?: number): Promise<MarketPriceDto[]>;
}
