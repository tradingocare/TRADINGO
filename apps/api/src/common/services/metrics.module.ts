import { Global, Module } from '@nestjs/common';
import { MetricsRegistryService } from './metrics-registry.service';
import { BusinessMetricsService } from './business-metrics.service';
import { QueueMetricsService } from './queue-metrics.service';
import { JobsModule } from '../../jobs/jobs.module';

@Global()
@Module({
  imports: [JobsModule],
  providers: [MetricsRegistryService, BusinessMetricsService, QueueMetricsService],
  exports: [MetricsRegistryService, BusinessMetricsService, QueueMetricsService],
})
export class MetricsModule {} // NOSONAR