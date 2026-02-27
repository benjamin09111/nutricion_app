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

        // Si tenemos un usuario autenticado, incluimos su ID en la llave del caché
        // Esto evita que nutricionistas distintos vean datos cargados en caché por otros
        const nutritionistId = request.user?.nutritionistId;
        const cacheKey = nutritionistId
            ? `${nutritionistId}:${httpAdapter.getRequestUrl(request)}`
            : httpAdapter.getRequestUrl(request);

        return cacheKey;
    }
}
