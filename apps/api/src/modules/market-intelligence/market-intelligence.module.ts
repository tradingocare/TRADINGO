import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketIntelligenceService } from './market-intelligence.service';
import { MarketIntelligenceController } from './market-intelligence.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MarketIntelligenceController],
  providers: [MarketIntelligenceService],
  exports: [MarketIntelligenceService],
})
export class MarketIntelligenceModule {}
