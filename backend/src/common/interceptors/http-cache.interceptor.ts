import { CacheInterceptor, CACHE_KEY_METADATA } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
    trackBy(context: ExecutionContext): string | undefined {
        const request = context.switchToHttp().getRequest();
        const { httpAdapter } = this.httpAdapterHost;

        const isHttpApp = !!httpAdapter && !!httpAdapter.getRequestMethod;
        const cacheMetadata = this.reflector.get(
            CACHE_KEY_METADATA,
            context.getHandler(),
        );

        if (!isHttpApp || cacheMetadata) {
            return cacheMetadata;
        }

        const requestMethod = httpAdapter.getRequestMethod(request);
        if (requestMethod !== 'GET') {
            return undefined;
        }

        const requestUrl = httpAdapter.getRequestUrl(request);

        // The foods catalog changes often and is highly personalized, so stale
        // GET responses here are more harmful than the cache hit benefit.
        if (requestUrl.startsWith('/foods')) {
            return undefined;
        }

        const userId = request.user?.id;
        const nutritionistId = request.user?.nutritionistId;
        const userIdentifier = nutritionistId || userId;

        return userIdentifier
            ? `${userIdentifier}:${requestUrl}`
            : requestUrl;
    }
}
