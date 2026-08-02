import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { MembershipService } from './membership.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminCreatePlanDto,
  AdminUpdatePlanDto,
  AdminUpsertPlanFeatureDto,
  AdminCreatePlanAddonDto,
  UpdateVisibilityDto,
  BatchUpdateFeatureDto,
} from './membership.dto';

@ApiTags('Membership Admin')
@Throttle(RateLimits.ADMIN_WRITE)
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class MembershipAdminController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans' })
  getAllPlans() {
    return this.membershipService.adminGetAllPlans();
  }

  @Post()
  @ApiOperation({ summary: 'Create plan' })
  createPlan(@Body() body: AdminCreatePlanDto, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminCreatePlan({ ...body, changedBy: userId });
  }

  @Patch(':planId')
  @ApiOperation({ summary: 'Update plan' })
  updatePlan(@Param('planId') planId: string, @Body() body: AdminUpdatePlanDto, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminUpdatePlan(planId, { ...body, changedBy: userId });
  }

  @Delete(':planId')
  @ApiOperation({ summary: 'Delete plan' })
  deletePlan(@Param('planId') planId: string, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminDeletePlan(planId, userId);
  }

  @Patch(':planId/visibility')
  @ApiOperation({ summary: 'Update plan visibility' })
  updateVisibility(@Param('planId') planId: string, @Body() body: UpdateVisibilityDto, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminUpdatePlanVisibility(planId, body.visibility, userId);
  }

  // ── Feature Matrix Builder ─────────────────────────────
  @Post(':planId/features/batch')
  @ApiOperation({ summary: 'Batch update plan features' })
  batchUpdateFeatures(@Param('planId') planId: string, @Body() body: { features: BatchUpdateFeatureDto[] }, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminBatchUpdateFeatures(planId, body.features, userId);
  }

  @Post(':planId/features')
  @ApiOperation({ summary: 'Upsert plan feature' })
  upsertFeature(@Param('planId') planId: string, @Body() body: AdminUpsertPlanFeatureDto) {
    return this.membershipService.adminUpsertPlanFeature(planId, body);
  }

  @Delete('features/:featureId')
  @ApiOperation({ summary: 'Delete plan feature' })
  deleteFeature(@Param('featureId') featureId: string) {
    return this.membershipService.adminDeletePlanFeature(featureId);
  }

  // ── Clone Plan ─────────────────────────────────────────
  @Post(':planId/clone')
  @ApiOperation({ summary: 'Clone plan' })
  clonePlan(@Param('planId') planId: string, @Body() body: { newPlanId: string; newName: string }, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminClonePlan(planId, body.newPlanId, body.newName, userId);
  }

  // ── Schedule Plan ──────────────────────────────────────
  @Post(':planId/schedule')
  @ApiOperation({ summary: 'Schedule plan' })
  schedulePlan(@Param('planId') planId: string, @Body() body: { scheduledVisibility?: string; autoPublishAt?: string; autoHideAt?: string }, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminSchedulePlan(planId, body, userId);
  }

  @Post('process-scheduled')
  @ApiOperation({ summary: 'Process scheduled plans' })
  processScheduledPlans() {
    return this.membershipService.adminProcessScheduledPlans();
  }

  // ── Add-ons ────────────────────────────────────────────
  @Post(':planId/addons')
  @ApiOperation({ summary: 'Create plan addon' })
  createAddon(@Param('planId') planId: string, @Body() body: AdminCreatePlanAddonDto) {
    return this.membershipService.adminCreatePlanAddon(planId, body);
  }

  @Delete('addons/:addonId')
  @ApiOperation({ summary: 'Delete plan addon' })
  deleteAddon(@Param('addonId') addonId: string) {
    return this.membershipService.adminDeletePlanAddon(addonId);
  }

  // ── Launch Mode ────────────────────────────────────────
  @Get('launch-mode')
  @ApiOperation({ summary: 'Get launch mode' })
  getLaunchMode() {
    return this.membershipService.getLaunchMode();
  }

  @Post('launch-mode')
  @ApiOperation({ summary: 'Set launch mode' })
  setLaunchMode(@Body('enabled') enabled: boolean, @CurrentUser('sub') userId?: string) {
    return this.membershipService.setLaunchMode(enabled, userId);
  }

  // ── Seed ───────────────────────────────────────────────
  @Post('seed-launch')
  @ApiOperation({ summary: 'Seed launch plans' })
  seedLaunchPlans() {
    return this.membershipService.adminSeedLaunchPlans();
  }

  // ── Comparison Builder ─────────────────────────────────
  @Post('compare')
  @ApiOperation({ summary: 'Compare plans' })
  comparePlans(@Body('planIds') planIds: string[]) {
    return this.membershipService.adminGetPlanComparison(planIds);
  }

  // ── Upgrade Simulator ──────────────────────────────────
  @Get('simulate-upgrade')
  @ApiOperation({ summary: 'Simulate plan upgrade' })
  simulateUpgrade(@Query('from') fromPlanId: string, @Query('to') toPlanId: string) {
    return this.membershipService.adminGetUpgradeSimulation(fromPlanId, toPlanId);
  }

  // ── Feature Preview ────────────────────────────────────
  @Get(':planId/features-preview')
  @ApiOperation({ summary: 'Get plan feature preview' })
  featurePreview(@Param('planId') planId: string) {
    return this.membershipService.adminGetFeaturePreview(planId);
  }

  // ── Audit Logs ─────────────────────────────────────────
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get all audit logs' })
  getAllAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.membershipService.adminGetAllAuditLogs(page || 1, limit || 50);
  }

  @Get(':planId/audit-logs')
  @ApiOperation({ summary: 'Get plan audit logs' })
  getPlanAuditLogs(@Param('planId') planId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.membershipService.adminGetPlanAuditLogs(planId, page || 1, limit || 50);
  }

  // ── Subscription Management ─────────────────────────────
  @Get('subscriptions')
  @ApiOperation({ summary: 'List all subscriptions' })
  getAllSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('planId') planId?: string,
    @Query('search') search?: string,
  ) {
    return this.membershipService.adminGetAllSubscriptions(page || 1, limit || 20, { status, planId, search });
  }

  @Get('subscriptions/summary')
  @ApiOperation({ summary: 'Subscription summary stats' })
  getSubscriptionSummary() {
    return this.membershipService.adminGetSubscriptionSummary();
  }

  @Post('subscriptions/:companyId/upgrade')
  @ApiOperation({ summary: 'Admin upgrade subscription' })
  adminUpgradeSubscription(
    @Param('companyId') companyId: string,
    @Body() body: { newPlanId: string; planTier: string; amount: number; paymentId: string },
  ) {
    return this.membershipService.upgradeSubscription(companyId, body.newPlanId, body.planTier, body.amount, body.paymentId);
  }

  @Post('subscriptions/:companyId/downgrade')
  @ApiOperation({ summary: 'Admin downgrade subscription' })
  adminDowngradeSubscription(
    @Param('companyId') companyId: string,
    @Body() body: { newPlanId: string; effectiveAt?: string },
  ) {
    return this.membershipService.downgradeSubscription(companyId, body.newPlanId, body.effectiveAt);
  }

  @Post('subscriptions/:companyId/suspend')
  @ApiOperation({ summary: 'Admin suspend subscription' })
  adminSuspendSubscription(@Param('companyId') companyId: string, @Body() body: { reason: string }) {
    return this.membershipService.suspendSubscription(companyId, body.reason);
  }

  @Post('subscriptions/:companyId/reactivate')
  @ApiOperation({ summary: 'Admin reactivate subscription' })
  adminReactivateSubscription(@Param('companyId') companyId: string) {
    return this.membershipService.reactivateSubscription(companyId);
  }

  @Post('process-expired')
  @ApiOperation({ summary: 'Process expired subscriptions' })
  processExpired() {
    return this.membershipService.processExpiredSubscriptions();
  }
}
