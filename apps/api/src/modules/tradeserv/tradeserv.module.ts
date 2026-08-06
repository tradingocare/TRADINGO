import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { CatalogAdapterModule } from '../catalog-adapter/catalog-adapter.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { MarketplaceIntelligenceModule } from '../marketplace-intelligence/marketplace-intelligence.module';
import { PaymentModule } from '../payment/payment.module';
import { GocashIntegrationModule } from '../gocash-integration/gocash-integration.module';
import { CommissionModule } from '../commission/commission.module';
import { PayoutModule } from '../payout/payout.module';
import { TradeservService } from './tradeserv.service';
import { TradeservIndexSyncService } from './tradeserv-index-sync.service';
import { AiTradeservService } from './ai-tradeserv.service';
import { BookingFinancialOrchestratorService } from './booking-financial-orchestrator.service';
import { TradeservController } from './tradeserv.controller';
import { TradeservSearchController } from './tradeserv-search.controller';
import { TradeservBookingController } from './tradeserv-booking.controller';
import { TradeservProposalController } from './tradeserv-proposal.controller';
import { TradeservAdminController } from './tradeserv-admin.controller';
import { AiTradeservController } from './ai-tradeserv.controller';
import { TradeservInquiryController } from './tradeserv-inquiry.controller';
import { TradeservInquiryService } from './tradeserv-inquiry.service';

@Module({
  imports: [
    PrismaModule,
    SearchModule,
    CatalogAdapterModule,
    AiGatewayModule,
    TradTrustModule,
    MarketplaceIntelligenceModule,
    PaymentModule,
    GocashIntegrationModule,
    CommissionModule,
    PayoutModule,
  ],
  controllers: [
    TradeservController,
    TradeservSearchController,
    TradeservBookingController,
    TradeservProposalController,
    TradeservAdminController,
    AiTradeservController,
    TradeservInquiryController,
  ],
  providers: [TradeservService, TradeservIndexSyncService, AiTradeservService, TradeservInquiryService, BookingFinancialOrchestratorService],
  exports: [TradeservService, TradeservIndexSyncService, AiTradeservService, TradeservInquiryService],
})
export class TradeservModule implements OnModuleInit {
  constructor(
    private readonly tradeservService: TradeservService,
    private readonly indexSyncService: TradeservIndexSyncService,
  ) {}

  async onModuleInit() {
    this.tradeservService.setIndexSyncService(this.indexSyncService);
    try {
      await this.indexSyncService.ensureIndex();
    } catch {
      // Index setup failure is non-blocking — search falls back to Prisma
    }
  }
}
