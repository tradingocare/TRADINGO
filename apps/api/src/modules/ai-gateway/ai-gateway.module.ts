import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AiGatewayService } from './ai-gateway.service'
import { ProviderRegistryService } from './provider-registry.service'
import { ProviderRouterService } from './provider-router.service'
import { PromptManagerService } from './prompt-manager.service'
import { ApiKeyVaultService } from './api-key-vault.service'
import { AiCreditsService } from './ai-credits.service'
import { UsageTrackerService } from './usage-tracker.service'
import { CostEngineService } from './cost-engine.service'
import { ProviderHealthService } from './provider-health.service'
import { ModelRegistryService } from './model-registry.service'
import { AiGatewayController } from './ai-gateway.controller'
import { AdminAiGatewayController } from './admin-ai-gateway.controller'
import { OpenRouterProvider } from './providers/openrouter.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { GroqProvider } from './providers/groq.provider'
import { TavilyProvider } from './providers/tavily.provider'
import { FirecrawlProvider } from './providers/firecrawl.provider'

@Module({
  imports: [PrismaModule],
  controllers: [AiGatewayController, AdminAiGatewayController],
  providers: [
    AiGatewayService,
    ProviderRegistryService,
    ProviderRouterService,
    PromptManagerService,
    ApiKeyVaultService,
    AiCreditsService,
    UsageTrackerService,
    CostEngineService,
    ProviderHealthService,
    ModelRegistryService,
    OpenRouterProvider,
    GeminiProvider,
    GroqProvider,
    TavilyProvider,
    FirecrawlProvider,
  ],
  exports: [
    AiGatewayService,
    ProviderRegistryService,
    PromptManagerService,
    AiCreditsService,
    UsageTrackerService,
    CostEngineService,
    ProviderHealthService,
    ModelRegistryService,
  ],
})
export class AiGatewayModule {}
