import { Module } from '@nestjs/common';
import { CatalogImportController } from './catalog-import.controller';
import { CatalogImportService } from './catalog-import.service';
import { CsvParserService } from './services/csv-parser.service';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { SearchModule } from '../modules/search/search.module';

@Module({
  imports: [SearchModule],
  controllers: [CatalogImportController],
  providers: [CatalogImportService, CsvParserService, ImportOrchestratorService],
  exports: [CatalogImportService, CsvParserService, ImportOrchestratorService],
})
export class CatalogImportModule {}
