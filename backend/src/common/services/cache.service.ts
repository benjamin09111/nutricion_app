import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Optional() @Inject(CACHE_MANAGER) private cacheManager: Cache) {}

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
  async invalidateNutritionistPrefix(
    nutritionistId: string,
    prefix: string,
  ): Promise<void> {
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

    try {
      if (!store || typeof store.keys !== 'function') {
        this.logger.warn(
          'Cache store does not support keys() method. Resetting entire cache as fallback.',
        );
        await this.reset();
        return;
      }

      let keys: string[] = [];
      try {
        // Try passing pattern first (works for Redis)
        keys = await store.keys(pattern);
      } catch (e) {
        // If it fails, it might require no arguments
        keys = await store.keys();
      }

      // Fallback: If no keys are returned with pattern, get all and filter manually (works for memory store)
      if (!keys || keys.length === 0) {
        const allKeys = await store.keys();
        if (allKeys && allKeys.length > 0) {
          // Convert * to regex .*
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          keys = allKeys.filter((k: string) => regex.test(k));
        }
      }

      if (keys && keys.length > 0) {
        await Promise.all(
          keys.map((key: string) => this.cacheManager.del(key)),
        );
        this.logger.log(
          `Invalidated ${keys.length} keys for pattern ${pattern}`,
        );
      } else {
        this.logger.log(`No keys found to invalidate for pattern ${pattern}`);
      }
    } catch (error) {
      this.logger.error(
        `Error invalidating cache for pattern ${pattern}. Forcing full cache wipe.`,
        error,
      );
      await this.reset();
    }
  }

  async reset(): Promise<void> {
    if (!this.cacheManager) return;
    await (this.cacheManager as any).clear();
  }
}
