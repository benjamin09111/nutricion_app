import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { AiService } from './services/ai.service';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';

@Global()
@Module({
    providers: [CacheService, AiService, HttpCacheInterceptor],
    exports: [CacheService, AiService, HttpCacheInterceptor],
})
export class CommonModule { }
