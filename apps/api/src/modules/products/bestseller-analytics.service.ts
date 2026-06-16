import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BestsellerAnalyticsService {
  private readonly logger = new Logger(BestsellerAnalyticsService.name);

  async trackCalculationTotal(metadata?: Record<string, unknown>): Promise<void> {
    this.logger.log(`Analytics: bestseller_calculation_total`, metadata);
  }

  async trackProductsTotal(count: number): Promise<void> {
    this.logger.log(`Analytics: bestseller_products_total count=${count}`);
  }

  async trackCategoriesTotal(count: number): Promise<void> {
    this.logger.log(`Analytics: bestseller_categories_total count=${count}`);
  }

  async trackSellersTotal(count: number): Promise<void> {
    this.logger.log(`Analytics: bestseller_sellers_total count=${count}`);
  }
}
