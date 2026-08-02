import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { GlobalBrandController } from './controllers/global-brand.controller';
import { GlobalAttributeController } from './controllers/global-attribute.controller';
import { TaxonomyController } from './controllers/taxonomy.controller';
import { CatalogAdminController } from './controllers/catalog-admin.controller';
import { EnterpriseSearchController } from './controllers/enterprise-search.controller';
import { GlobalBrandService } from './services/global-brand.service';
import { GlobalAttributeService } from './services/global-attribute.service';
import { TaxonomyService } from './services/taxonomy.service';
import { CatalogAdminService } from './services/catalog-admin.service';
import { EnterpriseSearchService } from './services/enterprise-search.service';
import { SynonymIntelligenceService } from './services/synonym-intelligence.service';
import { EnterpriseRankingService } from './services/enterprise-ranking.service';
import { EnterpriseSearchAnalyticsService } from './services/enterprise-search-analytics.service';
import { EnterpriseCommerceEventService } from './services/enterprise-commerce-event.service';
import { EnterpriseCommerceEventHandler } from './services/enterprise-commerce-event.handler';
import { AiModule } from '../ai/ai.module';
import { GocashIntegrationModule } from '../gocash-integration/gocash-integration.module';
import { AdvertisingModule } from '../advertising/advertising.module';

@Module({
  imports: [PrismaModule, SearchModule, AiModule, GocashIntegrationModule, AdvertisingModule],
  controllers: [
    GlobalBrandController,
    GlobalAttributeController,
    TaxonomyController,
    CatalogAdminController,
    EnterpriseSearchController,
  ],
  providers: [
    GlobalBrandService,
    GlobalAttributeService,
    TaxonomyService,
    CatalogAdminService,
    EnterpriseSearchService,
    SynonymIntelligenceService,
    EnterpriseRankingService,
    EnterpriseSearchAnalyticsService,
    EnterpriseCommerceEventService,
    EnterpriseCommerceEventHandler,
  ],
  exports: [
    GlobalBrandService,
    GlobalAttributeService,
    TaxonomyService,
    CatalogAdminService,
    EnterpriseSearchService,
    SynonymIntelligenceService,
    EnterpriseRankingService,
    EnterpriseSearchAnalyticsService,
    EnterpriseCommerceEventService,
    EnterpriseCommerceEventHandler,
  ],
})
export class EnterpriseCatalogModule {}
