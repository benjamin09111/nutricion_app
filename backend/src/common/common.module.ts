import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';

@Global()
@Module({
    providers: [CacheService, HttpCacheInterceptor],
    exports: [CacheService, HttpCacheInterceptor],
})
export class CommonModule { }
