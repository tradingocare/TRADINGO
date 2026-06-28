import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuyerAnalyticsService } from './buyer-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Buyer — Analytics')
@UseGuards(JwtAuthGuard)
@Controller('buyer/analytics')
export class BuyerAnalyticsController {
  constructor(private readonly service: BuyerAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Analytics overview' })
  getOverview(@CurrentUser('sub') userId: string) {
    return this.service.getOverview(userId);
  }

  @Get('spending')
  @ApiOperation({ summary: 'Monthly spending' })
  getSpendingByMonth(@CurrentUser('sub') userId: string) {
    return this.service.getSpendingByMonth(userId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top purchased products' })
  getTopPurchasedProducts(@CurrentUser('sub') userId: string) {
    return this.service.getTopPurchasedProducts(userId);
  }
}
