import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { ProductAnalyticsController } from './product-analytics.controller';
import { ProductAnalyticsService } from './product-analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [MetricsController, ProductAnalyticsController],
  providers: [MetricsService, ProductAnalyticsService],
  exports: [MetricsService, ProductAnalyticsService],
})
export class MetricsModule {}
