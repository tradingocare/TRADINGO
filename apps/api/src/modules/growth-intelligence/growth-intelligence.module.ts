import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GrowthIntelligenceService } from './growth-intelligence.service';
import { GrowthIntelligenceController } from './growth-intelligence.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GrowthIntelligenceController],
  providers: [GrowthIntelligenceService],
  exports: [GrowthIntelligenceService],
})
export class GrowthIntelligenceModule {}
