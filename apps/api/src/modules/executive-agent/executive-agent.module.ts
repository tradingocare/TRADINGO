import { Module, OnModuleInit } from '@nestjs/common';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { FounderAiModule } from '../founder-ai/founder-ai.module';
import { AiFederationModule } from '../ai-federation/ai-federation.module';
import { AiRuntimeModule } from '../ai-runtime/ai-runtime.module';
import { EnterpriseIntelligenceModule } from '../enterprise-intelligence/enterprise-intelligence.module';
import { FounderExecutiveAgentService } from './executive-agent.service';
import { FounderExecutiveAgentController, AdminExecutiveAgentController } from './executive-agent.controller';
import { FOUNDER_AGENT_CAPABILITIES } from './interfaces/executive.interfaces';

@Module({
  imports: [FounderAiModule, AiFederationModule, AiRuntimeModule, EnterpriseIntelligenceModule],
  controllers: [FounderExecutiveAgentController, AdminExecutiveAgentController],
  providers: [FounderExecutiveAgentService],
  exports: [FounderExecutiveAgentService],
})
export class FounderExecutiveAgentModule implements OnModuleInit {
  constructor(private readonly agentRegistry: AgentRegistryService) {}

  onModuleInit() {
    this.agentRegistry.register({
      id: 'founder',
      name: 'TradeAI Founder Executive Agent',
      description: 'Strategic executive coordinator — synthesizes signals from every TradeAI agent into prioritized executive insights including enterprise digital twin intelligence',
      version: '1.0.0',
      roles: ['SUPER_ADMIN'],
      basePath: '/founder/executive',
      capabilities: FOUNDER_AGENT_CAPABILITIES,
      dependencies: ['FounderAiModule', 'AiFederationModule', 'AiRuntimeModule', 'EnterpriseIntelligenceModule'],
    });
  }
}
