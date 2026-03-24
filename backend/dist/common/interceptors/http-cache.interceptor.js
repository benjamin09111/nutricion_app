"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpCacheInterceptor = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
let HttpCacheInterceptor = class HttpCacheInterceptor extends cache_manager_1.CacheInterceptor {
    trackBy(context) {
        const request = context.switchToHttp().getRequest();
        const { httpAdapter } = this.httpAdapterHost;
        const isHttpApp = !!httpAdapter && !!httpAdapter.getRequestMethod;
        const cacheMetadata = this.reflector.get(cache_manager_1.CACHE_KEY_METADATA, context.getHandler());
        if (!isHttpApp || cacheMetadata) {
            return cacheMetadata;
        }
        const requestMethod = httpAdapter.getRequestMethod(request);
        if (requestMethod !== 'GET') {
            return undefined;
        }
        const nutritionistId = request.user?.nutritionistId;
        const cacheKey = nutritionistId
            ? `${nutritionistId}:${httpAdapter.getRequestUrl(request)}`
            : httpAdapter.getRequestUrl(request);
        return cacheKey;
    }
};
exports.HttpCacheInterceptor = HttpCacheInterceptor;
exports.HttpCacheInterceptor = HttpCacheInterceptor = __decorate([
    (0, common_1.Injectable)()
], HttpCacheInterceptor);
//# sourceMappingURL=http-cache.interceptor.js.map