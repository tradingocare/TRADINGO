import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { StorageModule } from '../modules/storage/storage.module';

@Module({
  imports: [TerminusModule, AnalyticsModule, StorageModule],
  controllers: [HealthController],
})
export class HealthModule {}
