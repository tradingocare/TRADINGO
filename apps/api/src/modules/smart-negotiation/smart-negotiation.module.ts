import { Module, forwardRef } from '@nestjs/common';
import { SmartNegotiationController } from './smart-negotiation.controller';
import { SmartNegotiationService } from './smart-negotiation.service';
import { AiNegotiationController } from './ai-negotiation.controller';
import { AiNegotiationService } from './ai-negotiation.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { QuoteModule } from '../quote/quote.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';

@Module({
  imports: [AiGatewayModule, forwardRef(() => QuoteModule), forwardRef(() => TradTrustModule)],
  controllers: [SmartNegotiationController, AiNegotiationController],
  providers: [SmartNegotiationService, AiNegotiationService],
  exports: [SmartNegotiationService, AiNegotiationService],
})
export class SmartNegotiationModule {}
