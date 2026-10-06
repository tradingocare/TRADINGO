import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { StorageModule } from '../modules/storage/storage.module';
import { SearchModule } from '../modules/search/search.module';
import { ProductionConfigValidator } from '../common/services/production-config-validator.service';

@Module({
  imports: [TerminusModule, AnalyticsModule, StorageModule, SearchModule],
  providers: [ProductionConfigValidator],
  controllers: [HealthController],
})
export class HealthModule {}
