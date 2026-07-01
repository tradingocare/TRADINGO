import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { MyQuotesController } from './my-quotes.controller';
import { AdminQuotesController } from './admin-quotes.controller';
import { AiQuoteController } from './ai-quote.controller';
import { QuoteService } from './quote.service';
import { AiQuoteService } from './ai-quote.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';

@Module({
  imports: [AiGatewayModule, TradTrustModule],
  controllers: [QuoteController, MyQuotesController, AdminQuotesController, AiQuoteController],
  providers: [QuoteService, AiQuoteService],
  exports: [QuoteService, AiQuoteService],
})
export class QuoteModule {}
