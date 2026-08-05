import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignDto, ClaimCampaignDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Campaign Engine')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create campaign' })
  @Roles('ADMIN')
  create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignService.create(dto, req.user?.userId ?? 'SYSTEM');
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  @Roles('ADMIN')
  findAll(@Query() query: QueryCampaignDto) {
    return this.campaignService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active campaigns' })
  @Roles('BUYER', 'SELLER')
  getActive(@Req() req: any) {
    return this.campaignService.getActiveCampaigns(req.user?.userId, req.user?.companyId);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Get campaigns by type' })
  @Roles('BUYER', 'SELLER')
  getByType(@Param('type') type: string) {
    return this.campaignService.getCampaignsByType(type);
  }

  @Get('my-claims')
  @ApiOperation({ summary: 'Get my campaign claims' })
  @Roles('BUYER', 'SELLER')
  getMyClaims(@Req() req: any) {
    return this.campaignService.getMyClaims(req.user?.userId);
  }

  @Get('admin/dashboard')
  @ApiOperation({ summary: 'Get campaign admin dashboard' })
  @Roles('ADMIN')
  getAdminDashboard() {
    return this.campaignService.getAdminDashboard();
  }

  @Get('seller')
  @ApiOperation({ summary: 'Get seller campaigns' })
  @Roles('SELLER')
  getSellerCampaigns(@Req() req: any) {
    return this.campaignService.getSellerCampaigns(req.user?.companyId);
  }

  @Post('check-eligibility')
  @ApiOperation({ summary: 'Check campaign eligibility' })
  @Roles('BUYER', 'SELLER')
  checkEligibility(@Body() body: { campaignId: string; companyId?: string }, @Req() req: any) {
    return this.campaignService.checkEligibility(body.campaignId, req.user?.userId, body.companyId);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim campaign reward' })
  @Roles('BUYER', 'SELLER')
  claimReward(@Body() dto: ClaimCampaignDto, @Req() req: any) {
    return this.campaignService.claimReward({ ...dto, userId: dto.userId ?? req.user?.userId });
  }

  @Post('process-expired')
  @ApiOperation({ summary: 'Process expired campaigns' })
  @Roles('ADMIN')
  processExpired() {
    return this.campaignService.processExpiredCampaigns();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @Roles('BUYER', 'SELLER', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.campaignService.delete(id);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone campaign' })
  @Roles('ADMIN')
  clone(@Param('id') id: string) {
    return this.campaignService.clone(id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  @Roles('ADMIN')
  pause(@Param('id') id: string) {
    return this.campaignService.pause(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume campaign' })
  @Roles('ADMIN')
  resume(@Param('id') id: string) {
    return this.campaignService.resume(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive campaign' })
  @Roles('ADMIN')
  archive(@Param('id') id: string) {
    return this.campaignService.archive(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  @Roles('ADMIN')
  getAnalytics(@Param('id') id: string) {
    return this.campaignService.getCampaignAnalytics(id);
  }

  @Post(':id/evaluate-rules')
  @ApiOperation({ summary: 'Evaluate campaign rules' })
  @Roles('ADMIN')
  evaluateRules(@Param('id') id: string, @Body() context: Record<string, unknown>) {
    return this.campaignService.evaluateRules(id, context);
  }
}
