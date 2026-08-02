import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module'
import { AiOrchestratorModule } from '../ai-orchestrator/ai-orchestrator.module'
import { QueueNames } from '../../jobs/queues'
import { AiRuntimeController } from './ai-runtime.controller'
import { AiAgentRuntimeService } from './ai-agent-runtime.service'
import { AiCircuitBreakerService } from './ai-circuit-breaker.service'
import { AiSlaEngineService } from './ai-sla-engine.service'
import { AiStreamingRuntimeService } from './ai-streaming-runtime.service'
import { AiTelemetryService } from './ai-telemetry.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueNames.AI }),
    AiGatewayModule,
    AiOrchestratorModule,
  ],
  controllers: [AiRuntimeController],
  providers: [
    AiAgentRuntimeService,
    AiCircuitBreakerService,
    AiSlaEngineService,
    AiStreamingRuntimeService,
    AiTelemetryService,
  ],
  exports: [
    AiAgentRuntimeService,
    AiCircuitBreakerService,
    AiSlaEngineService,
    AiStreamingRuntimeService,
    AiTelemetryService,
  ],
})
export class AiRuntimeModule {}
