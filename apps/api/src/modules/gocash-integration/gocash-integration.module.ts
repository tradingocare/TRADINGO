import { Module } from '@nestjs/common';
import { GocashModule } from '../gocash/gocash.module';
import { GocashIntegrationController } from './gocash-integration.controller';
import { GocashIntegrationService } from './gocash-integration.service';

@Module({
  imports: [GocashModule],
  controllers: [GocashIntegrationController],
  providers: [GocashIntegrationService],
  exports: [GocashIntegrationService],
})
export class GocashIntegrationModule {}
