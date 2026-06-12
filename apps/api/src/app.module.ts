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
import { TradTrustModule } from './modules/tradtrust/tradtrust.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { IndustriesModule } from './modules/industries/industries.module';
import { ProductsModule } from './modules/products/products.module';
import { TradfindModule } from './modules/tradfind/tradfind.module';
import { VendorCodesModule } from './modules/vendor-codes/vendor-codes.module';
import { CertificationsModule } from './modules/certifications/certifications.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { GoCashModule } from './modules/go-cash/go-cash.module';
import { SellerAnalyticsModule } from './modules/seller-analytics/seller-analytics.module';
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
    TradfindModule,
    VendorCodesModule,
    CertificationsModule,
    GalleryModule,
    GoCashModule,
    SellerAnalyticsModule,
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
