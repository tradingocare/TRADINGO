import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { CrmService } from './crm.service';
import { CreateLeadDto, UpdateLeadDto, QueryLeadDto, CreateCampaignDto, UpdateCampaignDto, CampaignQueryDto } from './dto';

@ApiTags('CRM')
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post()
  @ApiOperation({ summary: 'Create lead' })
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.crmService.createLead(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List leads' })
  list(@Query() query: QueryLeadDto) {
    return this.crmService.listLeads(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  get(@Param('id') id: string) {
    return this.crmService.getLead(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.crmService.updateLead(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  delete(@Param('id') id: string) {
    return this.crmService.deleteLead(id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead' })
  convert(@Param('id') id: string, @Body('companyId') companyId?: string) {
    return this.crmService.convertLead(id, companyId);
  }

  @Post(':id/mark-lost')
  @ApiOperation({ summary: 'Mark lead as lost' })
  markLost(@Param('id') id: string, @Body('reason') reason: string) {
    return this.crmService.markLost(id, reason);
  }

  @Post(':id/reassign')
  @ApiOperation({ summary: 'Reassign lead' })
  reassign(@Param('id') id: string, @Body('ownerId') ownerId: string) {
    return this.crmService.reassignLead(id, ownerId);
  }

  @Post(':id/recalculate-score')
  @ApiOperation({ summary: 'Recalculate lead score' })
  recalculateScore(@Param('id') id: string) {
    return this.crmService.recalculateScore(id);
  }

  // ─── Campaign Endpoints ───────────────────────────────────

  @Post('campaigns')
  @ApiOperation({ summary: 'Create campaign' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  createCampaign(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.crmService.createCampaign(dto, req.user.id);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns' })
  listCampaigns(@Query() query: CampaignQueryDto) {
    return this.crmService.listCampaigns(query);
  }

  @Get('campaigns/dashboard')
  @ApiOperation({ summary: 'Campaign dashboard stats' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getCampaignDashboard() {
    return this.crmService.getCampaignDashboard();
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign details' })
  getCampaign(@Param('id') id: string) {
    return this.crmService.getCampaign(id);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update campaign' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.crmService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete campaign' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteCampaign(@Param('id') id: string) {
    return this.crmService.deleteCampaign(id);
  }

  @Post('campaigns/:id/leads')
  @ApiOperation({ summary: 'Add leads to campaign' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  addLeadsToCampaign(@Param('id') id: string, @Body('leadIds') leadIds: string[]) {
    return this.crmService.addLeadsToCampaign(id, leadIds);
  }

  @Delete('campaigns/:id/leads')
  @ApiOperation({ summary: 'Remove leads from campaign' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  removeLeadsFromCampaign(@Param('id') id: string, @Body('leadIds') leadIds: string[]) {
    return this.crmService.removeLeadsFromCampaign(id, leadIds);
  }

  @Get('campaigns/:id/analytics')
  @ApiOperation({ summary: 'Campaign analytics' })
  getCampaignAnalytics(@Param('id') id: string) {
    return this.crmService.getCampaignAnalytics(id);
  }
}
