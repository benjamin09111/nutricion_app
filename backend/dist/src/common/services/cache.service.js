"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
let CacheService = CacheService_1 = class CacheService {
    cacheManager;
    logger = new common_1.Logger(CacheService_1.name);
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    async get(key) {
        if (!this.cacheManager)
            return undefined;
        return await this.cacheManager.get(key);
    }
    async set(key, value, ttl) {
        if (!this.cacheManager)
            return;
        await this.cacheManager.set(key, value, ttl);
    }
    async del(key) {
        if (!this.cacheManager)
            return;
        await this.cacheManager.del(key);
    }
    async invalidateNutritionistPrefix(nutritionistId, prefix) {
        const pattern = `${nutritionistId}:*${prefix}*`;
        await this.invalidatePattern(pattern);
    }
    async invalidateGlobalPrefix(prefix) {
        const pattern = `*${prefix}*`;
        await this.invalidatePattern(pattern);
    }
    async invalidatePattern(pattern) {
        if (!this.cacheManager)
            return;
        const store = this.cacheManager.store;
        if (!store || !store.keys) {
            this.logger.warn('Cache store does not support keys() method for pattern invalidation');
            return;
        }
        try {
            const keys = await store.keys(pattern);
            if (keys && keys.length > 0) {
                await Promise.all(keys.map(key => this.cacheManager.del(key)));
                this.logger.log(`Invalidated ${keys.length} keys for pattern ${pattern}`);
            }
        }
        catch (error) {
            this.logger.error(`Error invalidating cache for pattern ${pattern}`, error);
        }
    }
    async reset() {
        if (!this.cacheManager)
            return;
        await this.cacheManager.clear();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], CacheService);
//# sourceMappingURL=cache.service.js.map