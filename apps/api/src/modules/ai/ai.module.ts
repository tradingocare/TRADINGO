import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { PromptService } from './prompt.service';
import { AiProductIntelligenceService } from './ai-product-intelligence.service';
import { AiProductIntelligenceController } from './ai-product-intelligence.controller';
import { CatalogQualityService } from './catalog-quality.service';
import { CatalogQualityController } from './catalog-quality.controller';
import { CatalogAdminController } from './catalog-admin.controller';
import { AiBulkService } from './ai-bulk.service';
import { AiBulkController } from './ai-bulk.controller';
import { CommerceIntelligenceService } from './commerce-intelligence.service';
import { CommerceIntelligenceController } from './commerce-intelligence.controller';
import { ProductCompletenessService } from './product-completeness.service';
import { ProductCompletenessController } from './product-completeness.controller';
import { CatalogAnalyticsService } from './catalog-analytics.service';

@Module({
  imports: [PrismaModule, AiGatewayModule],
  controllers: [AiProductIntelligenceController, CatalogQualityController, CatalogAdminController, AiBulkController, CommerceIntelligenceController, ProductCompletenessController],
  providers: [PromptService, AiProductIntelligenceService, CatalogQualityService, AiBulkService, CommerceIntelligenceService, ProductCompletenessService, CatalogAnalyticsService],
  exports: [PromptService, AiProductIntelligenceService, CatalogQualityService, CommerceIntelligenceService, ProductCompletenessService, CatalogAnalyticsService],
})
export class AiModule {}
