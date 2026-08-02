import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { AiService } from './services/ai.service';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditService } from './audit/audit.service';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditController } from './audit/audit.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [
    CacheService,
    AiService,
    HttpCacheInterceptor,
    AuditService,
    AuditInterceptor,
  ],
  exports: [
    CacheService,
    AiService,
    HttpCacheInterceptor,
    AuditService,
    AuditInterceptor,
  ],
})
export class CommonModule {}
