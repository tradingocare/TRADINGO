import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
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
} from './membership.dto';

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class MembershipAdminController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  getAllPlans() {
    return this.membershipService.adminGetAllPlans();
  }

  @Post()
  createPlan(@Body() body: AdminCreatePlanDto, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminCreatePlan({ ...body, changedBy: userId });
  }

  @Patch(':planId')
  updatePlan(@Param('planId') planId: string, @Body() body: AdminUpdatePlanDto, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminUpdatePlan(planId, { ...body, changedBy: userId });
  }

  @Delete(':planId')
  deletePlan(@Param('planId') planId: string, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminDeletePlan(planId, userId);
  }

  @Patch(':planId/visibility')
  updateVisibility(@Param('planId') planId: string, @Body('visibility') visibility: any, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminUpdatePlanVisibility(planId, visibility, userId);
  }

  // ── Feature Matrix Builder ─────────────────────────────
  @Post(':planId/features/batch')
  batchUpdateFeatures(@Param('planId') planId: string, @Body() body: { features: any[] }, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminBatchUpdateFeatures(planId, body.features, userId);
  }

  @Post(':planId/features')
  upsertFeature(@Param('planId') planId: string, @Body() body: AdminUpsertPlanFeatureDto) {
    return this.membershipService.adminUpsertPlanFeature(planId, body);
  }

  @Delete('features/:featureId')
  deleteFeature(@Param('featureId') featureId: string) {
    return this.membershipService.adminDeletePlanFeature(featureId);
  }

  // ── Clone Plan ─────────────────────────────────────────
  @Post(':planId/clone')
  clonePlan(@Param('planId') planId: string, @Body() body: { newPlanId: string; newName: string }, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminClonePlan(planId, body.newPlanId, body.newName, userId);
  }

  // ── Schedule Plan ──────────────────────────────────────
  @Post(':planId/schedule')
  schedulePlan(@Param('planId') planId: string, @Body() body: { scheduledVisibility?: string; autoPublishAt?: string; autoHideAt?: string }, @CurrentUser('sub') userId?: string) {
    return this.membershipService.adminSchedulePlan(planId, body, userId);
  }

  @Post('process-scheduled')
  processScheduledPlans() {
    return this.membershipService.adminProcessScheduledPlans();
  }

  // ── Add-ons ────────────────────────────────────────────
  @Post(':planId/addons')
  createAddon(@Param('planId') planId: string, @Body() body: AdminCreatePlanAddonDto) {
    return this.membershipService.adminCreatePlanAddon(planId, body);
  }

  @Delete('addons/:addonId')
  deleteAddon(@Param('addonId') addonId: string) {
    return this.membershipService.adminDeletePlanAddon(addonId);
  }

  // ── Launch Mode ────────────────────────────────────────
  @Get('launch-mode')
  getLaunchMode() {
    return this.membershipService.getLaunchMode();
  }

  @Post('launch-mode')
  setLaunchMode(@Body('enabled') enabled: boolean, @CurrentUser('sub') userId?: string) {
    return this.membershipService.setLaunchMode(enabled, userId);
  }

  // ── Seed ───────────────────────────────────────────────
  @Post('seed-launch')
  seedLaunchPlans() {
    return this.membershipService.adminSeedLaunchPlans();
  }

  // ── Comparison Builder ─────────────────────────────────
  @Post('compare')
  comparePlans(@Body('planIds') planIds: string[]) {
    return this.membershipService.adminGetPlanComparison(planIds);
  }

  // ── Upgrade Simulator ──────────────────────────────────
  @Get('simulate-upgrade')
  simulateUpgrade(@Query('from') fromPlanId: string, @Query('to') toPlanId: string) {
    return this.membershipService.adminGetUpgradeSimulation(fromPlanId, toPlanId);
  }

  // ── Feature Preview ────────────────────────────────────
  @Get(':planId/features-preview')
  featurePreview(@Param('planId') planId: string) {
    return this.membershipService.adminGetFeaturePreview(planId);
  }

  // ── Audit Logs ─────────────────────────────────────────
  @Get('audit-logs')
  getAllAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.membershipService.adminGetAllAuditLogs(page || 1, limit || 50);
  }

  @Get(':planId/audit-logs')
  getPlanAuditLogs(@Param('planId') planId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.membershipService.adminGetPlanAuditLogs(planId, page || 1, limit || 50);
  }
}
