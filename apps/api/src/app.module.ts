import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard, ThrottlerStorage, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { logger } from './common/logger';

import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  awsConfig,
  opensearchConfig,
    sentryConfig,
    clickhouseConfig,
    razorpayConfig,
    validationSchema,
} from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/services/redis.module';
import { RedisService } from './common/services/redis.service';
import { RedisThrottlerStorage } from './common/services/redis-throttler-storage';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CompanyLocationsModule } from './modules/company-locations/company-locations.module';
import { CompanyVerificationModule } from './modules/company-verification/company-verification.module';
import { UserVerificationModule } from './modules/user-verification/user-verification.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { TradTrustModule } from './modules/tradtrust/tradtrust.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CatalogAdapterModule } from './modules/catalog-adapter/catalog-adapter.module';
import { IndustriesModule } from './modules/industries/industries.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductOnboardingModule } from './product-onboarding/product-onboarding.module';
import { TradfindModule } from './modules/tradfind/tradfind.module';
import { VendorCodesModule } from './modules/vendor-codes/vendor-codes.module';
import { CertificationsModule } from './modules/certifications/certifications.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { SellerAnalyticsModule } from './modules/seller-analytics/seller-analytics.module';
import { RfqModule } from './modules/rfq/rfq.module';
import { TradmatchModule } from './modules/tradmatch/tradmatch.module';
import { QuoteModule } from './modules/quote/quote.module';
import { ChatModule } from './modules/chat/chat.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { ManualPaymentModule } from './modules/manual-payment/manual-payment.module';
import { DisputeModule } from './modules/dispute/dispute.module';
import { BetaProgramModule } from './modules/beta-program/beta-program.module';
import { SupportModule } from './modules/support/support.module';
import { LaunchModule } from './modules/launch/launch.module';
import { IncidentResponseModule } from './modules/incident-response/incident-response.module';
import { TradgoModule } from './modules/tradgo/tradgo.module';
import { MalwareModule } from './modules/malware/malware.module';
import { CatalogImportModule } from './catalog-import/catalog-import.module';
import { ProductClaimsModule } from './modules/product-claims/product-claims.module';
import { CategoryTemplatesModule } from './modules/category-templates/category-templates.module';
import { ProductAttributesModule } from './modules/product-attributes/product-attributes.module';
import { NearMeModule } from './modules/near-me/near-me.module';
import { ProductLocationModule } from './modules/product-location/product-location.module';
import { SellerModule } from './modules/seller/seller.module';
import { MembershipModule } from './modules/membership/membership.module';
import { BillingModule } from './modules/billing/billing.module';
import { SellerProductModule } from './modules/seller-product/seller-product.module';
import { BuyerModule } from './modules/buyer/buyer.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { SmartRfqModule } from './modules/smart-rfq/smart-rfq.module';
import { SmartNegotiationModule } from './modules/smart-negotiation/smart-negotiation.module';
import { SmartPoModule } from './modules/smart-po/smart-po.module';
import { SmartOrderModule } from './modules/smart-order/smart-order.module';
import { SmartShipmentModule } from './modules/smart-shipment/smart-shipment.module';
import { SmartDeliveryModule } from './modules/smart-delivery/smart-delivery.module';
import { GocashModule } from './modules/gocash/gocash.module';
import { ReferralModule } from './modules/referral/referral.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { WalletApiModule } from './modules/wallet-api/wallet-api.module';
import { GocashIntegrationModule } from './modules/gocash-integration/gocash-integration.module';
import { SmsModule } from './modules/sms/sms.module';
import { AdvertisingModule } from './modules/advertising/advertising.module';
import { CrmModule } from './modules/crm/crm.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AiModule } from './modules/ai/ai.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { AdminIntelligenceModule } from './modules/admin-intelligence/admin-intelligence.module';
import { LocationIntelligenceModule } from './modules/location-intelligence/location-intelligence.module';
import { MarketplaceIntelligenceModule } from './modules/marketplace-intelligence/marketplace-intelligence.module';
import { FreightIntelligenceModule } from './modules/freight-intelligence/freight-intelligence.module';
import { MarketIntelligenceModule } from './modules/market-intelligence/market-intelligence.module';
import { TerritoryIntelligenceModule } from './modules/territory-intelligence/territory-intelligence.module';
import { GocashEcosystemModule } from './modules/gocash-ecosystem/gocash-ecosystem.module';
import { FounderAiModule } from './modules/founder-ai/founder-ai.module';
import { TradeservModule } from './modules/tradeserv/tradeserv.module';
import { MarketplaceCatalogBridgeModule } from './modules/marketplace-catalog-bridge/marketplace-catalog-bridge.module';
import { TradeTalkModule } from './modules/tradetalk/tradetalk.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AdminSettingsModule } from './modules/admin-settings/admin-settings.module';
import { MetricsModule } from './common/services/metrics.module';
import { MetricsRegistryService } from './common/services/metrics-registry.service';
import { EnterpriseCatalogModule } from './modules/enterprise-catalog/enterprise-catalog.module';
import { AiOrchestratorModule } from './modules/ai-orchestrator/ai-orchestrator.module';
import { AiRuntimeModule } from './modules/ai-runtime/ai-runtime.module';
import { SellerAgentModule } from './modules/seller-agent/seller-agent.module';
import { BuyerAgentModule } from './modules/buyer-agent/buyer-agent.module';
import { AgentFrameworkModule } from './modules/agent-framework/agent-framework.module';
import { AdminAgentModule } from './modules/admin-agent/admin-agent.module';
import { AiFederationModule } from './modules/ai-federation/ai-federation.module';
import { FounderExecutiveAgentModule } from './modules/executive-agent/executive-agent.module';
import { ProfessionalAgentModule } from './modules/professional-agent/professional-agent.module';
import { CommunityAgentModule } from './modules/community-agent/community-agent.module';
import { ProfileCompletionModule } from './modules/profile-completion/profile-completion.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { FeatureFlagModule } from './modules/feature-flags/feature-flag.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { EnterpriseIntelligenceModule } from './modules/enterprise-intelligence/enterprise-intelligence.module';
import { GrowthIntelligenceModule } from './modules/growth-intelligence/growth-intelligence.module';
import { ExecutiveIntelligenceModule } from './modules/executive-intelligence/executive-intelligence.module';
import { CommissionModule } from './modules/commission/commission.module';
import { RefundModule } from './modules/refund/refund.module';
import { PayoutModule } from './modules/payout/payout.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        awsConfig,
        opensearchConfig,
        sentryConfig,
        clickhouseConfig,
        razorpayConfig,
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService): ThrottlerModuleOptions => ({
        throttlers: [{ limit: 100, ttl: 60000 }],
        storage: new RedisThrottlerStorage(redisService) as unknown as ThrottlerStorage,
      }),
    }),
    BullModule.forRootAsync({
      useFactory: (configService) => ({
        connection: { url: configService.get('redis.url') },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 86400 },
          removeOnFail: { age: 604800 },
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    StorageModule,
    SearchModule,
    AnalyticsModule,
    JobsModule,
    HealthModule,
    OrganizationsModule,
    CompaniesModule,
    CompanyLocationsModule,
    CompanyVerificationModule,
    TradTrustModule,
    CategoriesModule,
    CatalogAdapterModule,
    IndustriesModule,
    ProductsModule,
    ProductOnboardingModule,
    TradfindModule,
    VendorCodesModule,
    CertificationsModule,
    GalleryModule,
    SellerAnalyticsModule,
    RfqModule,
    TradmatchModule,
    TradgoModule,
    MalwareModule,
    QuoteModule,
    ChatModule,
    OrderModule,
    PaymentModule,
    NotificationModule,
    EscrowModule,
    SettlementModule,
    ManualPaymentModule,
    DisputeModule,
    BetaProgramModule,
    SupportModule,
    LaunchModule,
    IncidentResponseModule,
    CatalogImportModule,
    ProductClaimsModule,
    CategoryTemplatesModule,
    ProductAttributesModule,
    NearMeModule,
    ProductLocationModule,
    SellerModule,
    MembershipModule,
    BillingModule,
    SellerProductModule,
    BuyerModule,
    UserVerificationModule,
    ReputationModule,
    CommunicationModule,
    SmartRfqModule,
    SmartNegotiationModule,
    SmartPoModule,
    SmartOrderModule,
    SmartShipmentModule,
    SmartDeliveryModule,
    GocashModule,
    ReferralModule,
    CampaignModule,
    WalletApiModule,
    GocashIntegrationModule,
    SmsModule,
    AdvertisingModule,
    CrmModule,
    FinanceModule,
    AiModule,
    AiGatewayModule,
    AdminIntelligenceModule,
    LocationIntelligenceModule,
    MarketplaceIntelligenceModule,
    FreightIntelligenceModule,
    MarketIntelligenceModule,
    TerritoryIntelligenceModule,
    GocashEcosystemModule,
    FounderAiModule,
    TradeservModule,
    MarketplaceCatalogBridgeModule,
    TradeTalkModule,
    EnterpriseCatalogModule,
    AiOrchestratorModule,
    AiRuntimeModule,
    AgentFrameworkModule,
    SellerAgentModule,
    BuyerAgentModule,
    AdminAgentModule,
    AiFederationModule,
    FounderExecutiveAgentModule,
    ProfessionalAgentModule,
    CommunityAgentModule,
    EnterpriseIntelligenceModule,
    ExecutiveIntelligenceModule,
    HomepageModule,
    TrackingModule,
    GrowthIntelligenceModule,
    CommissionModule,
    RefundModule,
    PayoutModule,
    FeatureFlagModule,
    OnboardingModule,
    ProfileCompletionModule,
    AuditLogModule,
    AdminSettingsModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: 'RAZORPAY_CONFIG_VALIDATOR',
      useFactory: (configService: ConfigService) => {
        const keyId = configService.get<string>('razorpay.keyId');
        const keySecret = configService.get<string>('razorpay.keySecret');
        if (!keyId || !keySecret || keyId.includes('your-') || keySecret.includes('your-')) {
          logger.warn({ razorpayKeyConfigured: false }, 'Razorpay keys are missing or contain placeholder values. Payment and payout features will fail in production.');
        }
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
