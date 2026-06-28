import { Module } from '@nestjs/common';
import { BuyerController } from './buyer.controller';
import { BuyerService } from './buyer.service';
import { SavedSupplierController } from './saved-supplier.controller';
import { SavedSupplierService } from './saved-supplier.service';
import { RequirementController } from './requirement.controller';
import { RequirementService } from './requirement.service';
import { BuyerNotificationController } from './buyer-notification.controller';
import { BuyerNotificationService } from './buyer-notification.service';
import { BuyerDownloadController } from './buyer-download.controller';
import { BuyerDownloadService } from './buyer-download.service';
import { BuyerAnalyticsController } from './buyer-analytics.controller';
import { BuyerAnalyticsService } from './buyer-analytics.service';

@Module({
  controllers: [
    BuyerController,
    SavedSupplierController,
    RequirementController,
    BuyerNotificationController,
    BuyerDownloadController,
    BuyerAnalyticsController,
  ],
  providers: [
    BuyerService,
    SavedSupplierService,
    RequirementService,
    BuyerNotificationService,
    BuyerDownloadService,
    BuyerAnalyticsService,
  ],
  exports: [BuyerService],
})
export class BuyerModule {}
