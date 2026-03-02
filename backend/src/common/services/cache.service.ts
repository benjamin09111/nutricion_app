import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    constructor(@Optional() @Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async get<T>(key: string): Promise<T | undefined> {
        if (!this.cacheManager) return undefined;
        return await this.cacheManager.get<T>(key);
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!this.cacheManager) return;
        await this.cacheManager.set(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        if (!this.cacheManager) return;
        await this.cacheManager.del(key);
    }

    /**
     * Invalida todas las llaves que coincidan con un patrón para un nutricionista específico.
     * Ejemplo: invalidateNutritionistPrefix(nutriId, 'patients') invalidará todo lo relacionado
     * a pacientes para ese nutricionista.
     */
    async invalidateNutritionistPrefix(nutritionistId: string, prefix: string): Promise<void> {
        const pattern = `${nutritionistId}:*${prefix}*`;
        await this.invalidatePattern(pattern);
    }

    async invalidateGlobalPrefix(prefix: string): Promise<void> {
        const pattern = `*${prefix}*`;
        await this.invalidatePattern(pattern);
    }

    private async invalidatePattern(pattern: string): Promise<void> {
        if (!this.cacheManager) return;
        const store = (this.cacheManager as any).store;
        if (!store || !store.keys) {
            this.logger.warn('Cache store does not support keys() method for pattern invalidation');
            return;
        }

        try {
            const keys: string[] = await store.keys(pattern);

            if (keys && keys.length > 0) {
                await Promise.all(keys.map(key => this.cacheManager.del(key)));
                this.logger.log(`Invalidated ${keys.length} keys for pattern ${pattern}`);
            }
        } catch (error) {
            this.logger.error(`Error invalidating cache for pattern ${pattern}`, error);
        }
    }

    async reset(): Promise<void> {
        if (!this.cacheManager) return;
        await (this.cacheManager as any).clear();
    }
}
