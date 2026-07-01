import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

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
import { IndustriesModule } from './modules/industries/industries.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductOnboardingModule } from './product-onboarding/product-onboarding.module';
import { TradfindModule } from './modules/tradfind/tradfind.module';
import { VendorCodesModule } from './modules/vendor-codes/vendor-codes.module';
import { CertificationsModule } from './modules/certifications/certifications.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { GoCashModule } from './modules/go-cash/go-cash.module';
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
import { LaunchModule } from './modules/launch/launch.module';
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
    ThrottlerModule.forRoot([{ limit: 100, ttl: 60000 }]),
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
    IndustriesModule,
    ProductsModule,
    ProductOnboardingModule,
    TradfindModule,
    VendorCodesModule,
    CertificationsModule,
    GalleryModule,
    GoCashModule,
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
    LaunchModule,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
