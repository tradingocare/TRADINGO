import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { Public } from '../../common/decorators/public.decorator';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpsertPreferenceDto } from './dto/notification-preference.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CreateNewsletterCampaignDto, UpdateNewsletterCampaignDto, NewsletterQueryDto, SubscribeDto, SendNewsletterDto } from './dto/create-newsletter.dto';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowQueryDto } from './dto/marketing-workflow.dto';

@ApiTags('Notifications')
@Throttle(RateLimits.WRITE_GENERAL)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for a company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.findAll(companyId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @Param('companyId') companyId: string,
    @Query('userId') userId?: string,
  ) {
    return this.notificationService.getUnreadCount(companyId, userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(
    @Param('companyId') companyId: string,
    @Query('userId') userId: string,
  ) {
    return this.notificationService.getPreferences(companyId, userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Upsert notification preference' })
  async upsertPreference(
    @Param('companyId') companyId: string,
    @Query('userId') userId: string,
    @Body() dto: UpsertPreferenceDto,
  ) {
    return this.notificationService.upsertPreference(companyId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification details' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.findOne(companyId, id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(companyId, id);
  }

  @Post(':id/unread')
  @ApiOperation({ summary: 'Mark notification as unread' })
  async markAsUnread(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsUnread(companyId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @Param('companyId') companyId: string,
    @Body() dto: MarkReadDto,
  ) {
    if (dto.ids?.length) {
      return this.notificationService.markSpecificAsRead(companyId, dto.ids);
    }
    return this.notificationService.markAllAsRead(companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a notification' })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    await this.notificationService.softDelete(companyId, id);
    return { deleted: true };
  }

  // ─── Newsletter Subscribers ────────────────────────────────

  @Public()
  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  async subscribe(@Body() dto: SubscribeDto) {
    return this.notificationService.subscribe(dto);
  }

  @Public()
  @Post('newsletter/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  async unsubscribe(@Body('email') email: string) {
    return this.notificationService.unsubscribe(email);
  }

  @Get('newsletter/subscribers')
  @ApiOperation({ summary: 'List newsletter subscribers (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listSubscribers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.listSubscribers({ status, search, page, limit });
  }

  @Get('newsletter/subscribers/stats')
  @ApiOperation({ summary: 'Newsletter subscriber stats (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSubscriberStats() {
    return this.notificationService.getSubscriberStats();
  }

  // ─── Newsletter Campaigns ──────────────────────────────────

  @Post('newsletter/campaigns')
  @ApiOperation({ summary: 'Create newsletter campaign (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createNewsletterCampaign(@Body() dto: CreateNewsletterCampaignDto, @Req() req: any) {
    return this.notificationService.createNewsletterCampaign(dto, req.user.id);
  }

  @Get('newsletter/campaigns')
  @ApiOperation({ summary: 'List newsletter campaigns (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listNewsletterCampaigns(@Query() query: NewsletterQueryDto) {
    return this.notificationService.listNewsletterCampaigns(query);
  }

  @Get('newsletter/campaigns/:campaignId')
  @ApiOperation({ summary: 'Get newsletter campaign (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getNewsletterCampaign(@Param('campaignId') campaignId: string) {
    return this.notificationService.getNewsletterCampaign(campaignId);
  }

  @Put('newsletter/campaigns/:campaignId')
  @ApiOperation({ summary: 'Update newsletter campaign (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateNewsletterCampaign(@Param('campaignId') campaignId: string, @Body() dto: UpdateNewsletterCampaignDto) {
    return this.notificationService.updateNewsletterCampaign(campaignId, dto);
  }

  @Post('newsletter/campaigns/:campaignId/send')
  @ApiOperation({ summary: 'Send newsletter campaign (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async sendNewsletterCampaign(@Param('campaignId') campaignId: string, @Body() dto?: SendNewsletterDto) {
    return this.notificationService.sendNewsletterCampaign(campaignId, dto);
  }

  // ─── Marketing Automation Workflows ────────────────────────

  @Post('workflows')
  @ApiOperation({ summary: 'Create marketing workflow (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createWorkflow(@Body() dto: CreateWorkflowDto, @Req() req: any) {
    return this.notificationService.createWorkflow(dto, req.user.id);
  }

  @Get('workflows')
  @ApiOperation({ summary: 'List marketing workflows (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listWorkflows(@Query() query: WorkflowQueryDto) {
    return this.notificationService.listWorkflows(query);
  }

  @Get('workflows/stats')
  @ApiOperation({ summary: 'Marketing workflow stats (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getWorkflowStats() {
    return this.notificationService.getWorkflowStats();
  }

  @Get('workflows/:workflowId')
  @ApiOperation({ summary: 'Get marketing workflow (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getWorkflow(@Param('workflowId') workflowId: string) {
    return this.notificationService.getWorkflow(workflowId);
  }

  @Put('workflows/:workflowId')
  @ApiOperation({ summary: 'Update marketing workflow (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateWorkflow(@Param('workflowId') workflowId: string, @Body() dto: UpdateWorkflowDto) {
    return this.notificationService.updateWorkflow(workflowId, dto);
  }

  @Delete('workflows/:workflowId')
  @ApiOperation({ summary: 'Delete marketing workflow (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteWorkflow(@Param('workflowId') workflowId: string) {
    return this.notificationService.deleteWorkflow(workflowId);
  }

  @Post('workflows/:workflowId/execute')
  @ApiOperation({ summary: 'Execute marketing workflow (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async executeWorkflow(
    @Param('workflowId') workflowId: string,
    @Body('triggerId') triggerId: string,
    @Body('context') context: Record<string, unknown>,
  ) {
    return this.notificationService.executeWorkflow(workflowId, triggerId, context);
  }
}
