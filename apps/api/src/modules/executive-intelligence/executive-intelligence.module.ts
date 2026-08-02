import { Module } from '@nestjs/common';
import { ExecutiveIntelligenceFacadeService } from './executive-intelligence.service';
import { ExecutiveIntelligenceController } from './executive-intelligence.controller';
import { FounderAiModule } from '../founder-ai/founder-ai.module';
import { EnterpriseIntelligenceModule } from '../enterprise-intelligence/enterprise-intelligence.module';
import { FinanceModule } from '../finance/finance.module';
import { GrowthIntelligenceModule } from '../growth-intelligence/growth-intelligence.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { KpiCatalogService } from './services/kpi-catalog.service';
import { AlertEngineService } from './services/alert-engine.service';
import { CorrelationEngineService } from './services/correlation-engine.service';
import { HealthIndexConsolidationService } from './services/health-index-consolidation.service';
import { KpiCatalogController } from './controllers/kpi-catalog.controller';
import { AlertEngineController } from './controllers/alert-engine.controller';
import { CorrelationEngineController } from './controllers/correlation-engine.controller';
import { UnifiedHealthController } from './controllers/unified-health.controller';

@Module({
  imports: [
    FounderAiModule,
    EnterpriseIntelligenceModule,
    FinanceModule,
    GrowthIntelligenceModule,
    AnalyticsModule,
  ],
  controllers: [
    ExecutiveIntelligenceController,
    KpiCatalogController,
    AlertEngineController,
    CorrelationEngineController,
    UnifiedHealthController,
  ],
  providers: [
    ExecutiveIntelligenceFacadeService,
    KpiCatalogService,
    AlertEngineService,
    CorrelationEngineService,
    HealthIndexConsolidationService,
  ],
  exports: [
    ExecutiveIntelligenceFacadeService,
    KpiCatalogService,
    AlertEngineService,
    CorrelationEngineService,
    HealthIndexConsolidationService,
  ],
})
export class ExecutiveIntelligenceModule {}
