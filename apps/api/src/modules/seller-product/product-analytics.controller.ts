import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductAnalyticsService } from './product-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Seller Analytics')
@UseGuards(JwtAuthGuard)
@Controller('seller/analytics')
export class ProductAnalyticsController {
  constructor(private readonly service: ProductAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Aggregate analytics overview' })
  getOverview(@CurrentUser('sub') userId: string) {
    return this.service.getOverview(userId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Per-product analytics' })
  getProductAnalytics(@CurrentUser('sub') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getProductAnalytics(userId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Top/bottom performers' })
  getPerformance(@CurrentUser('sub') userId: string) {
    return this.service.getPerformance(userId);
  }
}
