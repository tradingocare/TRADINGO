import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TerritoryIntelligenceService } from './territory-intelligence.service';
import { TerritoryIntelligenceController } from './territory-intelligence.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TerritoryIntelligenceController],
  providers: [TerritoryIntelligenceService],
  exports: [TerritoryIntelligenceService],
})
export class TerritoryIntelligenceModule {}
