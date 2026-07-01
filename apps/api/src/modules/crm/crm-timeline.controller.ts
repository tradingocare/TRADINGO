import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmTimelineService } from './crm-timeline.service';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmTimelineController {
  constructor(private readonly timelineService: CrmTimelineService) {}

  @Get(':leadId/timeline')
  getLeadTimeline(@Param('leadId') leadId: string) {
    return this.timelineService.getLeadTimeline(leadId);
  }

  @Get('company/:companyId/timeline')
  getCustomerTimeline(@Param('companyId') companyId: string, @Query('limit') limit?: string) {
    return this.timelineService.getCustomerTimeline(companyId, limit ? parseInt(limit, 10) : 100);
  }
}
