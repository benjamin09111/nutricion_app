import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ProductAnalyticsService } from './product-analytics.service';
import { ProductEventDto } from './dto/product-event.dto';
import { OptionalAuthGuard } from './optional-auth.guard';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('metrics')
export class ProductAnalyticsController {
  constructor(private readonly productAnalyticsService: ProductAnalyticsService) {}

  @Post('product-events')
  @UseGuards(OptionalAuthGuard)
  record(@Body() dto: ProductEventDto, @Request() request: any) {
    return this.productAnalyticsService.recordEvent(dto, request.user);
  }

  @Get('admin/product-analytics')
  @UseGuards(AuthGuard)
  getAdminAnalytics(@Request() request: any, @Query('days') days?: string) {
    return this.productAnalyticsService.getAdminAnalytics(request.user.role, Number(days) || 30);
  }
}
