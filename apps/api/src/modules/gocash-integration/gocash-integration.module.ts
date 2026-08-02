import { Module } from '@nestjs/common';
import { GocashModule } from '../gocash/gocash.module';
import { GocashIntegrationController } from './gocash-integration.controller';
import { GocashIntegrationService } from './gocash-integration.service';
import { CatalogRewardsService } from './catalog-rewards.service';

@Module({
  imports: [GocashModule],
  controllers: [GocashIntegrationController],
  providers: [GocashIntegrationService, CatalogRewardsService],
  exports: [GocashIntegrationService, CatalogRewardsService],
})
export class GocashIntegrationModule {}
