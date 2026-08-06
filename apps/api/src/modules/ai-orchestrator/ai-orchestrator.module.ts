import { Module } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module'
import { SmartRfqModule } from '../smart-rfq/smart-rfq.module'
import { QuoteModule } from '../quote/quote.module'
import { SmartNegotiationModule } from '../smart-negotiation/smart-negotiation.module'
import { FinanceModule } from '../finance/finance.module'
import { TradfindModule } from '../tradfind/tradfind.module'
import { AdminIntelligenceModule } from '../admin-intelligence/admin-intelligence.module'
import { TradeTalkModule } from '../tradetalk/tradetalk.module'
import { FounderAiModule } from '../founder-ai/founder-ai.module'
import { AiOrchestratorController } from './ai-orchestrator.controller'
import { AiOrchestratorService } from './ai-orchestrator.service'
import { AiWorkflowEngine } from './ai-workflow-engine.service'
import { AiActionRegistry } from './ai-action-registry'
import { AiMemoryService } from './ai-memory.service'
import { AiObservabilityService } from './ai-observability.service'
import { AiContextEngine } from './ai-context-engine.service'

@Module({
  imports: [
    AiModule,
    AiGatewayModule,
    SmartRfqModule,
    QuoteModule,
    SmartNegotiationModule,
    FinanceModule,
    TradfindModule,
    AdminIntelligenceModule,
    TradeTalkModule,
    FounderAiModule,
  ],
  controllers: [AiOrchestratorController],
  providers: [
    AiActionRegistry,
    AiMemoryService,
    AiObservabilityService,
    AiContextEngine,
    AiOrchestratorService,
    AiWorkflowEngine,
  ],
  exports: [AiOrchestratorService, AiWorkflowEngine, AiActionRegistry, AiContextEngine, AiObservabilityService],
})
export class AiOrchestratorModule {}
