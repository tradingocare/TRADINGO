import { Module } from '@nestjs/common';
import { AgentFrameworkModule } from '../agent-framework/agent-framework.module';
import { AiOrchestratorModule } from '../ai-orchestrator/ai-orchestrator.module';
import { TradeAgentFederationService } from './trade-agent-federation.service';
import { CapabilityMatchingService } from './capability-matching.service';
import { CollaborationEngine } from './collaboration-engine';
import { CrossAgentWorkflowService } from './cross-agent-workflow.service';
import { AgentMessagingService } from './agent-messaging.service';
import { FederationAnalyticsService } from './federation-analytics.service';
import { SharedContextService } from './shared-context.service';
import { FederationController, AdminFederationController } from './federation.controller';

@Module({
  imports: [AgentFrameworkModule, AiOrchestratorModule],
  controllers: [FederationController, AdminFederationController],
  providers: [
    TradeAgentFederationService,
    CapabilityMatchingService,
    CollaborationEngine,
    CrossAgentWorkflowService,
    AgentMessagingService,
    FederationAnalyticsService,
    SharedContextService,
  ],
  exports: [TradeAgentFederationService],
})
export class AiFederationModule {}
