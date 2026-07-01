import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { CrmService } from './crm.service';
import { CrmFollowUpService } from './crm-follow-up.service';
import { CrmNoteService } from './crm-note.service';
import { CrmTaskService } from './crm-task.service';
import { CrmTimelineService } from './crm-timeline.service';
import { CrmPipelineService } from './crm-pipeline.service';
import { CrmSearchService } from './crm-search.service';
import { CrmReportService } from './crm-report.service';
import { AiCrmService } from './ai-crm.service';
import { CrmController } from './crm.controller';
import { CrmFollowUpController } from './crm-follow-up.controller';
import { CrmNoteController } from './crm-note.controller';
import { CrmTaskController } from './crm-task.controller';
import { CrmTimelineController } from './crm-timeline.controller';
import { CrmPipelineController } from './crm-pipeline.controller';
import { CrmSearchController } from './crm-search.controller';
import { CrmReportController } from './crm-report.controller';
import { AdminCrmController } from './admin-crm.controller';
import { AiCrmController } from './ai-crm.controller';

@Module({
  imports: [PrismaModule, TradTrustModule, AiGatewayModule],
  controllers: [CrmController, CrmFollowUpController, CrmNoteController, CrmTaskController, CrmTimelineController, CrmPipelineController, CrmSearchController, CrmReportController, AdminCrmController, AiCrmController],
  providers: [CrmService, CrmFollowUpService, CrmNoteService, CrmTaskService, CrmTimelineService, CrmPipelineService, CrmSearchService, CrmReportService, AiCrmService],
  exports: [CrmService],
})
export class CrmModule {}
