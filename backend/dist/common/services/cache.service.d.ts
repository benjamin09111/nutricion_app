import type { Cache } from 'cache-manager';
export declare class CacheService {
    private cacheManager;
    private readonly logger;
    constructor(cacheManager: Cache);
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidateNutritionistPrefix(nutritionistId: string, prefix: string): Promise<void>;
    invalidateGlobalPrefix(prefix: string): Promise<void>;
    private invalidatePattern;
    reset(): Promise<void>;
}
