import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmTimelineService } from './crm-timeline.service';

@ApiTags('CRM Timeline')
@Throttle(RateLimits.MARKETPLACE_READ)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmTimelineController {
  constructor(private readonly timelineService: CrmTimelineService) {}

  @Get(':leadId/timeline')
  @ApiOperation({ summary: 'Get lead timeline' })
  getLeadTimeline(@Param('leadId') leadId: string) {
    return this.timelineService.getLeadTimeline(leadId);
  }

  @Get('company/:companyId/timeline')
  @ApiOperation({ summary: 'Get customer timeline' })
  getCustomerTimeline(@Param('companyId') companyId: string, @Query('limit') limit?: string) {
    return this.timelineService.getCustomerTimeline(companyId, limit ? parseInt(limit, 10) : 100);
  }
}
