import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { AiOrchestratorModule } from '../ai-orchestrator/ai-orchestrator.module';
import { BuyerAgentController } from './buyer-agent.controller';
import { BuyerAgentService } from './buyer-agent.service';

@Module({
  imports: [
    PrismaModule,
    TradTrustModule,
    forwardRef(() => AiOrchestratorModule),
  ],
  controllers: [BuyerAgentController],
  providers: [BuyerAgentService],
  exports: [BuyerAgentService],
})
export class BuyerAgentModule {}
