import { Module } from '@nestjs/common';
import { CatalogImportController } from './catalog-import.controller';
import { CatalogImportService } from './catalog-import.service';
import { CsvParserService } from './services/csv-parser.service';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { CatalogReconciliationService } from './services/catalog-reconciliation.service';
import { SearchModule } from '../modules/search/search.module';
import { ClamavModule } from '../modules/malware/clamav.module';
import { MarketplaceCatalogBridgeModule } from '../modules/marketplace-catalog-bridge/marketplace-catalog-bridge.module';

@Module({
  imports: [SearchModule, ClamavModule, MarketplaceCatalogBridgeModule],
  controllers: [CatalogImportController],
  providers: [CatalogImportService, CsvParserService, ImportOrchestratorService, CatalogReconciliationService],
  exports: [CatalogImportService, CsvParserService, ImportOrchestratorService, CatalogReconciliationService],
})
export class CatalogImportModule {}
