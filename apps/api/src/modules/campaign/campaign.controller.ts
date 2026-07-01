import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignDto, ClaimCampaignDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignService.create(dto, req.user?.userId ?? 'SYSTEM');
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: QueryCampaignDto) {
    return this.campaignService.findAll(query);
  }

  @Get('active')
  @Roles()
  getActive(@Req() req: any) {
    return this.campaignService.getActiveCampaigns(req.user?.userId, req.user?.companyId);
  }

  @Get('by-type/:type')
  @Roles()
  getByType(@Param('type') type: string) {
    return this.campaignService.getCampaignsByType(type);
  }

  @Get('my-claims')
  @Roles()
  getMyClaims(@Req() req: any) {
    return this.campaignService.getMyClaims(req.user?.userId);
  }

  @Get('admin/dashboard')
  @Roles('ADMIN')
  getAdminDashboard() {
    return this.campaignService.getAdminDashboard();
  }

  @Get('seller')
  @Roles()
  getSellerCampaigns(@Req() req: any) {
    return this.campaignService.getSellerCampaigns(req.user?.companyId);
  }

  @Post('check-eligibility')
  @Roles()
  checkEligibility(@Body() body: { campaignId: string; companyId?: string }, @Req() req: any) {
    return this.campaignService.checkEligibility(body.campaignId, req.user?.userId, body.companyId);
  }

  @Post('claim')
  @Roles()
  claimReward(@Body() dto: ClaimCampaignDto, @Req() req: any) {
    return this.campaignService.claimReward({ ...dto, userId: dto.userId ?? req.user?.userId });
  }

  @Post('process-expired')
  @Roles('ADMIN')
  processExpired() {
    return this.campaignService.processExpiredCampaigns();
  }

  @Get(':id')
  @Roles()
  findOne(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.campaignService.delete(id);
  }

  @Post(':id/clone')
  @Roles('ADMIN')
  clone(@Param('id') id: string) {
    return this.campaignService.clone(id);
  }

  @Post(':id/pause')
  @Roles('ADMIN')
  pause(@Param('id') id: string) {
    return this.campaignService.pause(id);
  }

  @Post(':id/resume')
  @Roles('ADMIN')
  resume(@Param('id') id: string) {
    return this.campaignService.resume(id);
  }

  @Post(':id/archive')
  @Roles('ADMIN')
  archive(@Param('id') id: string) {
    return this.campaignService.archive(id);
  }

  @Get(':id/analytics')
  @Roles('ADMIN')
  getAnalytics(@Param('id') id: string) {
    return this.campaignService.getCampaignAnalytics(id);
  }

  @Post(':id/evaluate-rules')
  @Roles()
  evaluateRules(@Param('id') id: string, @Body() context: Record<string, any>) {
    return this.campaignService.evaluateRules(id, context);
  }
}
