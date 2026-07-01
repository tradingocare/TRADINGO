import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { CreditService } from './credit.service';
import { CollectionsService } from './collections.service';
import { CreditNoteService } from './credit-notes.service';
import { FinanceDashboardService } from './finance-dashboard.service';
import { RmFinanceService } from './rm-finance.service';
import { AiFinanceService } from './ai-finance.service';
import { CreditController, CreditApprovalController } from './credit.controller';
import { CollectionsController } from './collections.controller';
import { CreditNoteController, DebitNoteController } from './credit-notes.controller';
import { FinanceDashboardController } from './finance-dashboard.controller';
import { RmFinanceController } from './rm-finance.controller';
import { AiFinanceController } from './ai-finance.controller';

@Module({
  imports: [PrismaModule, AiGatewayModule],
  controllers: [CreditController, CreditApprovalController, CollectionsController, CreditNoteController, DebitNoteController, FinanceDashboardController, RmFinanceController, AiFinanceController],
  providers: [CreditService, CollectionsService, CreditNoteService, FinanceDashboardService, RmFinanceService, AiFinanceService],
  exports: [CreditService, CreditNoteService, FinanceDashboardService],
})
export class FinanceModule {}
