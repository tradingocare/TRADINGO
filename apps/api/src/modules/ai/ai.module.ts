import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiProviderService } from './ai-provider.service';
import { PromptService } from './prompt.service';
import { OpenAiProvider } from './providers/openai.provider';
import { AiProductIntelligenceService } from './ai-product-intelligence.service';
import { AiProductIntelligenceController } from './ai-product-intelligence.controller';
import { CatalogQualityService } from './catalog-quality.service';
import { CatalogQualityController } from './catalog-quality.controller';
import { AiBulkService } from './ai-bulk.service';
import { AiBulkController } from './ai-bulk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AiProductIntelligenceController, CatalogQualityController, AiBulkController],
  providers: [AiProviderService, PromptService, OpenAiProvider, AiProductIntelligenceService, CatalogQualityService, AiBulkService],
  exports: [AiProviderService, PromptService, CatalogQualityService],
})
export class AiModule {}
