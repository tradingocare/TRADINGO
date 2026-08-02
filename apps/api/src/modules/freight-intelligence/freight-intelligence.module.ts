import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FreightIntelligenceService } from './freight-intelligence.service';
import { FreightIntelligenceController } from './freight-intelligence.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FreightIntelligenceController],
  providers: [FreightIntelligenceService],
  exports: [FreightIntelligenceService],
})
export class FreightIntelligenceModule {}
