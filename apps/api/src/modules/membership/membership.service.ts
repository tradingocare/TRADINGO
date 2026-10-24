import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, PlanVisibility, PlanType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { InvoiceService } from '../billing/invoice.service';
import { TaxService } from '../billing/tax.service';
import { verifySignature } from '../payment/utils/signature';
import { RazorpayService } from '../payment/gateways/razorpay.service';
import { isDelhiIntraState } from '../billing/utils/financial-year.util';
import type { EntitlementMap } from './plan-entitlements';
import { CORE_PLANS, PLAN_FEATURES } from './seed-data';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
    @Inject(forwardRef(() => TaxService))
    private readonly taxService: TaxService,
    private readonly razorpayService: RazorpayService,
    private readonly configService: ConfigService,
  ) {}

  // Launch mode: only plans with LAUNCH visibility
  async getLaunchPlans() {
    return this.getPlans(PlanVisibility.LAUNCH);
  }

  // Admin: get all plans regardless of visibility
  async adminGetAllPlans() {
    return this.prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { planFeatures: { orderBy: { sortOrder: 'asc' } }, planAddons: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // Admin: create a new plan
  async adminCreatePlan(data: {
    planId: string;
    name: string;
    description?: string;
    pricePlanA: number;
    pricePlanB: number;
    pricePlanC: number;
    duration?: number;
    sortOrder?: number;
    visibility?: PlanVisibility;
    isFree?: boolean;
    badgeText?: string;
    countryPricing?: any;
    upgradeRules?: any;
    downgradeRules?: any;
    gracePeriodDays?: number;
    renewalRules?: any;
    trialPeriodDays?: number;
    launchOfferEndsAt?: string;
    metadata?: any;
    features?: string[];
    changedBy?: string;
  }) {
    const existing = await this.prisma.membershipPlan.findUnique({ where: { planId: data.planId } });
    if (existing) throw new BadRequestException(`Plan with planId '${data.planId}' already exists`);

    const plan = await this.prisma.membershipPlan.create({
      data: {
        planId: data.planId,
        name: data.name,
        description: data.description || `${data.name} membership plan`,
        pricePlanA: data.pricePlanA,
        pricePlanB: data.pricePlanB,
        pricePlanC: data.pricePlanC,
        duration: data.duration ?? 12,
        sortOrder: data.sortOrder ?? 0,
        visibility: data.visibility ?? PlanVisibility.DRAFT,
        isFree: data.isFree ?? false,
        badgeText: data.badgeText,
        countryPricing: data.countryPricing,
        upgradeRules: data.upgradeRules,
        downgradeRules: data.downgradeRules,
        gracePeriodDays: data.gracePeriodDays ?? 0,
        renewalRules: data.renewalRules,
        trialPeriodDays: data.trialPeriodDays ?? 0,
        launchOfferEndsAt: data.launchOfferEndsAt ? new Date(data.launchOfferEndsAt) : undefined,
        metadata: data.metadata,
        features: data.features || [],
      },
    });

    // Create plan features from the features array
    if (data.features?.length) {
      await this.prisma.planFeature.createMany({
        data: data.features.map((f, i) => ({
          planId: data.planId,
          feature: f,
          included: true,
          sortOrder: i,
        })),
      });
    }

    await this.logAudit({ planId: data.planId, action: 'CREATED', newValue: JSON.stringify({ name: data.name, pricePlanA: data.pricePlanA }), changedBy: data.changedBy });

    return plan;
  }

  // Admin: update an existing plan
  async adminUpdatePlan(planId: string, data: {
    name?: string;
    description?: string;
    pricePlanA?: number;
    pricePlanB?: number;
    pricePlanC?: number;
    duration?: number;
    sortOrder?: number;
    isActive?: boolean;
    visibility?: PlanVisibility;
    isFree?: boolean;
    badgeText?: string;
    countryPricing?: any;
    upgradeRules?: any;
    downgradeRules?: any;
    gracePeriodDays?: number;
    renewalRules?: any;
    trialPeriodDays?: number;
    launchOfferEndsAt?: string | null;
    metadata?: any;
    changedBy?: string;
  }) {
    const existing = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!existing) throw new NotFoundException('Plan not found');

    const updateData: any = {};
    const auditEntries: string[] = [];

    if (data.name !== undefined) { updateData.name = data.name; auditEntries.push(`name: ${existing.name}→${data.name}`); }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.pricePlanA !== undefined) { updateData.pricePlanA = data.pricePlanA; auditEntries.push(`priceA: ${existing.pricePlanA}→${data.pricePlanA}`); }
    if (data.pricePlanB !== undefined) { updateData.pricePlanB = data.pricePlanB; auditEntries.push(`priceB: ${existing.pricePlanB}→${data.pricePlanB}`); }
    if (data.pricePlanC !== undefined) { updateData.pricePlanC = data.pricePlanC; auditEntries.push(`priceC: ${existing.pricePlanC}→${data.pricePlanC}`); }
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) { updateData.isActive = data.isActive; auditEntries.push(`isActive: ${existing.isActive}→${data.isActive}`); }
    if (data.visibility !== undefined) { updateData.visibility = data.visibility; auditEntries.push(`visibility: ${existing.visibility}→${data.visibility}`); }
    if (data.isFree !== undefined) { updateData.isFree = data.isFree; auditEntries.push(`isFree: ${existing.isFree}→${data.isFree}`); }
    if (data.badgeText !== undefined) updateData.badgeText = data.badgeText;
    if (data.countryPricing !== undefined) updateData.countryPricing = data.countryPricing;
    if (data.upgradeRules !== undefined) updateData.upgradeRules = data.upgradeRules;
    if (data.downgradeRules !== undefined) updateData.downgradeRules = data.downgradeRules;
    if (data.gracePeriodDays !== undefined) updateData.gracePeriodDays = data.gracePeriodDays;
    if (data.renewalRules !== undefined) updateData.renewalRules = data.renewalRules;
    if (data.trialPeriodDays !== undefined) updateData.trialPeriodDays = data.trialPeriodDays;
    if (data.launchOfferEndsAt !== undefined) updateData.launchOfferEndsAt = data.launchOfferEndsAt ? new Date(data.launchOfferEndsAt) : null;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    if (auditEntries.length > 0) {
      await this.logAudit({ planId, action: 'UPDATED', newValue: auditEntries.join('; '), changedBy: data.changedBy });
    }

    return this.prisma.membershipPlan.update({
      where: { planId },
      data: updateData,
    });
  }

  // Admin: delete a plan
  async adminDeletePlan(planId: string, changedBy?: string) {
    const existing = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!existing) throw new NotFoundException('Plan not found');

    // Check if any company is currently subscribed to this plan
    const companiesOnPlan = await this.prisma.company.count({
      where: { currentPlanId: planId, subscriptionStatus: 'ACTIVE' },
    });
    if (companiesOnPlan > 0) {
      throw new BadRequestException(`Cannot delete plan: ${companiesOnPlan} active subscriptions`);
    }

    await this.logAudit({ planId, action: 'DELETED', oldValue: existing.name, changedBy });

    await this.prisma.membershipPlan.delete({ where: { planId } });
    return { success: true, message: 'Plan deleted' };
  }

  // Admin: update plan visibility
  async adminUpdatePlanVisibility(planId: string, visibility: PlanVisibility, changedBy?: string) {
    const existing = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!existing) throw new NotFoundException('Plan not found');

    await this.logAudit({ planId, action: 'VISIBILITY_CHANGED', field: 'visibility', oldValue: existing.visibility, newValue: visibility, changedBy });

    return this.prisma.membershipPlan.update({
      where: { planId },
      data: { visibility },
    });
  }

  // Admin: upsert a plan feature
  async adminUpsertPlanFeature(planId: string, data: {
    id?: string;
    category?: string;
    feature: string;
    included?: boolean;
    value?: string;
    sortOrder?: number;
  }) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    if (data.id) {
      return this.prisma.planFeature.update({
        where: { id: data.id },
        data: {
          category: data.category,
          feature: data.feature,
          included: data.included ?? true,
          value: data.value,
          sortOrder: data.sortOrder ?? 0,
        },
      });
    }

    return this.prisma.planFeature.create({
      data: {
        planId,
        category: data.category,
        feature: data.feature,
        included: data.included ?? true,
        value: data.value,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  // Admin: delete a plan feature
  async adminDeletePlanFeature(featureId: string) {
    const existing = await this.prisma.planFeature.findUnique({ where: { id: featureId } });
    if (!existing) throw new NotFoundException('Plan feature not found');
    await this.prisma.planFeature.delete({ where: { id: featureId } });
    return { success: true };
  }

  // Admin: create a plan add-on
  async adminCreatePlanAddon(planId: string, data: {
    name: string;
    description?: string;
    price: number;
    duration?: number;
    sortOrder?: number;
  }) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.planAddon.create({
      data: {
        planId,
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration ?? 1,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  // Admin: delete a plan add-on
  async adminDeletePlanAddon(addonId: string) {
    const existing = await this.prisma.planAddon.findUnique({ where: { id: addonId } });
    if (!existing) throw new NotFoundException('Plan add-on not found');
    await this.prisma.planAddon.delete({ where: { id: addonId } });
    return { success: true };
  }

  // ── Audit Logging ──────────────────────────────────────
  private async logAudit(params: {
    planId: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    changedBy?: string;
    metadata?: any;
  }) {
    await this.prisma.planAuditLog.create({ data: params as any });
  }

  // ── Feature Matrix Builder ─────────────────────────────
  async adminBatchUpdateFeatures(planId: string, features: {
    category: string;
    feature: string;
    included: boolean;
    value?: string;
    sortOrder?: number;
  }[], changedBy?: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // Delete all existing features for this plan
    await this.prisma.planFeature.deleteMany({ where: { planId } });

    // Create new features
    await this.prisma.planFeature.createMany({
      data: features.map((f, i) => ({
        planId,
        category: f.category,
        feature: f.feature,
        included: f.included,
        value: f.value,
        sortOrder: f.sortOrder ?? i,
      })),
    });

    await this.logAudit({
      planId,
      action: 'FEATURE_MATRIX_UPDATED',
      newValue: JSON.stringify(features.map(f => f.feature)),
      changedBy,
      metadata: { count: features.length },
    });

    return this.prisma.planFeature.findMany({ where: { planId }, orderBy: { sortOrder: 'asc' } });
  }

  // ── Clone Plan ─────────────────────────────────────────
  async adminClonePlan(planId: string, newPlanId: string, newName: string, changedBy?: string) {
    const source = await this.prisma.membershipPlan.findUnique({
      where: { planId },
      include: { planFeatures: true, planAddons: true },
    });
    if (!source) throw new NotFoundException('Source plan not found');

    const existing = await this.prisma.membershipPlan.findUnique({ where: { planId: newPlanId } });
    if (existing) throw new BadRequestException(`Plan '${newPlanId}' already exists`);

    await this.prisma.membershipPlan.create({
      data: {
        planId: newPlanId,
        name: newName,
        description: `${newName} (cloned from ${source.name})`,
        pricePlanA: source.pricePlanA,
        pricePlanB: source.pricePlanB,
        pricePlanC: source.pricePlanC,
        duration: source.duration,
        sortOrder: source.sortOrder + 1,
        visibility: PlanVisibility.DRAFT,
        isFree: source.isFree,
        badgeText: null,
        features: source.features as any,
        gracePeriodDays: source.gracePeriodDays,
        trialPeriodDays: source.trialPeriodDays,
        upgradeRules: source.upgradeRules as any,
        downgradeRules: source.downgradeRules as any,
        renewalRules: source.renewalRules as any,
      },
    });

    // Clone features
    if (source.planFeatures.length > 0) {
      await this.prisma.planFeature.createMany({
        data: source.planFeatures.map(f => ({
          planId: newPlanId,
          category: f.category,
          feature: f.feature,
          included: f.included,
          value: f.value,
          sortOrder: f.sortOrder,
        })),
      });
    }

    // Clone add-ons
    if (source.planAddons.length > 0) {
      await this.prisma.planAddon.createMany({
        data: source.planAddons.map(a => ({
          planId: newPlanId,
          name: a.name,
          description: a.description,
          price: a.price,
          duration: a.duration,
          isActive: false,
          sortOrder: a.sortOrder,
        })),
      });
    }

    await this.logAudit({
      planId: newPlanId,
      action: 'CLONED',
      newValue: JSON.stringify({ sourcePlanId: planId, sourceName: source.name }),
      changedBy,
      metadata: { sourcePlanId: planId, featuresCloned: source.planFeatures.length, addonsCloned: source.planAddons.length },
    });

    return this.prisma.membershipPlan.findUnique({
      where: { planId: newPlanId },
      include: { planFeatures: { orderBy: { sortOrder: 'asc' } }, planAddons: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Schedule Plan ──────────────────────────────────────
  async adminSchedulePlan(planId: string, data: {
    scheduledVisibility?: string;
    autoPublishAt?: string;
    autoHideAt?: string;
  }, changedBy?: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const updateData: any = {};
    const changes: string[] = [];

    if (data.scheduledVisibility !== undefined) {
      updateData.scheduledVisibility = data.scheduledVisibility;
      changes.push(`scheduledVisibility: ${plan.scheduledVisibility}→${data.scheduledVisibility}`);
    }
    if (data.autoPublishAt !== undefined) {
      updateData.autoPublishAt = data.autoPublishAt ? new Date(data.autoPublishAt) : null;
      changes.push(`autoPublishAt: ${data.autoPublishAt || 'none'}`);
    }
    if (data.autoHideAt !== undefined) {
      updateData.autoHideAt = data.autoHideAt ? new Date(data.autoHideAt) : null;
      changes.push(`autoHideAt: ${data.autoHideAt || 'none'}`);
    }

    await this.logAudit({
      planId,
      action: 'SCHEDULED',
      newValue: changes.join('; '),
      changedBy,
      metadata: data,
    });

    return this.prisma.membershipPlan.update({ where: { planId }, data: updateData });
  }

  // Process scheduled visibility changes (called by cron or on-demand)
  async adminProcessScheduledPlans() {
    const now = new Date();
    const results = { published: 0, hidden: 0 };

    // Auto-publish: visibility = scheduledVisibility, set scheduledVisibility = null
    const toPublish = await this.prisma.membershipPlan.findMany({
      where: { autoPublishAt: { lte: now }, scheduledVisibility: { not: null } },
    });
    for (const plan of toPublish) {
      await this.prisma.membershipPlan.update({
        where: { id: plan.id },
        data: { visibility: plan.scheduledVisibility!, scheduledVisibility: null, autoPublishAt: null },
      });
      await this.logAudit({ planId: plan.planId, action: 'AUTO_PUBLISHED', newValue: plan.scheduledVisibility! });
      results.published++;
    }

    // Auto-hide: visibility = ARCHIVED
    const toHide = await this.prisma.membershipPlan.findMany({
      where: { autoHideAt: { lte: now }, visibility: { not: 'ARCHIVED' } },
    });
    for (const plan of toHide) {
      await this.prisma.membershipPlan.update({
        where: { id: plan.id },
        data: { visibility: 'ARCHIVED', autoHideAt: null },
      });
      await this.logAudit({ planId: plan.planId, action: 'AUTO_HIDDEN', newValue: 'ARCHIVED' });
      results.hidden++;
    }

    return results;
  }

  // ── Launch Mode Toggle ─────────────────────────────────
  async getLaunchMode() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: 'launch_mode' } });
    return { enabled: setting?.value === true || setting?.value === 'true', visiblePlans: ['trad-up', 'trade-smart-launch'] };
  }

  async setLaunchMode(enabled: boolean, changedBy?: string) {
    const previous = await this.prisma.appSetting.findUnique({ where: { key: 'launch_mode' } });
    const oldVal = previous?.value?.toString() || 'false';

    await this.prisma.appSetting.upsert({
      where: { key: 'launch_mode' },
      create: { key: 'launch_mode', value: enabled },
      update: { value: enabled },
    });

    await this.logAudit({
      planId: 'SYSTEM',
      action: 'LAUNCH_MODE_CHANGED',
      field: 'launch_mode',
      oldValue: oldVal,
      newValue: String(enabled),
      changedBy,
      metadata: { enabled },
    });

    return { enabled };
  }

  // Override getPlans to respect launch mode
  async getPlans(visibility?: PlanVisibility) {
    const launchMode = await this.prisma.appSetting.findUnique({ where: { key: 'launch_mode' } });
    const isLaunchMode = launchMode?.value === true || launchMode?.value === 'true';

    const where: any = { isActive: true };

    if (isLaunchMode) {
      // Launch mode: only show the two launch plans
      where.planId = { in: ['trad-up', 'trade-smart-launch'] };
    } else if (visibility) {
      where.visibility = visibility;
    } else {
      where.visibility = { in: ['LAUNCH', 'PUBLIC'] };
    }

    const plans = await this.prisma.membershipPlan.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { planFeatures: { orderBy: { sortOrder: 'asc' } }, planAddons: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    return plans;
  }

  // ── Plan Comparison Builder ────────────────────────────
  async adminGetPlanComparison(planIds: string[]) {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { planId: { in: planIds } },
      include: { planFeatures: { orderBy: { sortOrder: 'asc' } }, planAddons: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    if (plans.length !== planIds.length) {
      throw new NotFoundException('One or more plans not found');
    }

    // Build feature matrix across all selected plans
    const allFeatures = new Map<string, { category: string; label: string }>();
    const featureMap: Record<string, Record<string, { included: boolean; value: string }>> = {};

    for (const plan of plans) {
      featureMap[plan.planId] = {};
      for (const pf of plan.planFeatures) {
        const key = pf.feature.toLowerCase().replace(/\s+/g, '_');
        allFeatures.set(key, { category: pf.category || 'General', label: pf.feature });
        featureMap[plan.planId][key] = { included: pf.included, value: pf.value || '' };
      }
    }

    return {
      plans: plans.map(p => ({ planId: p.planId, name: p.name, pricePlanA: p.pricePlanA, duration: p.duration, isFree: p.isFree, badgeText: p.badgeText, visibility: p.visibility })),
      featureMatrix: Array.from(allFeatures.entries()).map(([key, meta]) => ({
        key,
        category: meta.category,
        label: meta.label,
        values: plans.map(p => featureMap[p.planId]?.[key] || { included: false, value: '' }),
      })),
    };
  }

  // ── Upgrade Simulator ──────────────────────────────────
  async adminGetUpgradeSimulation(fromPlanId: string, toPlanId: string) {
    const fromPlan = await this.prisma.membershipPlan.findUnique({
      where: { planId: fromPlanId },
      include: { planFeatures: true },
    });
    const toPlan = await this.prisma.membershipPlan.findUnique({
      where: { planId: toPlanId },
      include: { planFeatures: true },
    });

    if (!fromPlan || !toPlan) throw new NotFoundException('Plan not found');

    const fromFeatures = new Map(fromPlan.planFeatures.map(f => [f.feature.toLowerCase().replace(/\s+/g, '_'), f]));
    const toFeatures = new Map(toPlan.planFeatures.map(f => [f.feature.toLowerCase().replace(/\s+/g, '_'), f]));

    const unlocked: { feature: string; value: string }[] = [];
    const upgraded: { feature: string; from: string; to: string }[] = [];
    const same: string[] = [];

    for (const [key, tf] of toFeatures) {
      const ff = fromFeatures.get(key);
      if (!ff || (!ff.included && tf.included)) {
        unlocked.push({ feature: tf.feature, value: tf.value || 'enabled' });
      } else if (ff.included && tf.included && ff.value !== tf.value) {
        upgraded.push({ feature: tf.feature, from: ff.value || 'enabled', to: tf.value || 'enabled' });
      } else if (ff.included && tf.included) {
        same.push(tf.feature);
      }
    }

    return {
      fromPlan: { planId: fromPlan.planId, name: fromPlan.name, pricePlanA: fromPlan.pricePlanA },
      toPlan: { planId: toPlan.planId, name: toPlan.name, pricePlanA: toPlan.pricePlanA, priceDiff: toPlan.pricePlanA - fromPlan.pricePlanA },
      unlocked,
      upgraded,
      same,
      unlockedCount: unlocked.length,
      upgradedCount: upgraded.length,
    };
  }

  // ── Feature Preview ────────────────────────────────────
  async adminGetFeaturePreview(planId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { planId },
      include: { planFeatures: { orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }, planAddons: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const included = plan.planFeatures.filter(f => f.included);
    const locked = plan.planFeatures.filter(f => !f.included);
    const limits = plan.planFeatures.filter(f => f.value);

    return {
      planId: plan.planId,
      name: plan.name,
      totalFeatures: plan.planFeatures.length,
      included: included.map(f => ({ category: f.category, feature: f.feature, value: f.value })),
      locked: locked.map(f => ({ category: f.category, feature: f.feature })),
      limits: limits.map(f => ({ category: f.category, feature: f.feature, value: f.value })),
      addons: plan.planAddons,
      metadata: plan.metadata as any,
    };
  }

  // ── Plan Audit Logs ────────────────────────────────────
  async adminGetPlanAuditLogs(planId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.planAuditLog.findMany({
        where: { planId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.planAuditLog.count({ where: { planId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminGetAllAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.planAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.planAuditLog.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Audit hooks for existing operations
  private async auditPlanChange(planId: string, action: string, field: string, oldValue: string | undefined, newValue: string | undefined, changedBy?: string) {
    if (oldValue !== newValue) {
      await this.logAudit({ planId, action, field, oldValue, newValue, changedBy });
    }
  }

  // ── Admin: seed launch plans (TRAD UP™ + Trade Smart™)
  async adminSeedLaunchPlans() {
    const existingTradUp = await this.prisma.membershipPlan.findUnique({ where: { planId: 'trad-up' } });
    const existingTradeSmart = await this.prisma.membershipPlan.findUnique({ where: { planId: 'trade-smart-launch' } });

    const results: any[] = [];

    if (!existingTradUp) {
      await this.prisma.membershipPlan.create({
        data: {
          planId: 'trad-up',
          name: 'TRAD UP™',
          description: 'Launch Membership — Start selling on TRADINGO with zero investment. Valid for 90 days.',
          pricePlanA: 0,
          pricePlanB: 0,
          pricePlanC: 0,
          // Display/back-compat months field. The authoritative TRAD UP term is
          // metadata.durationDays (days; founder-locked default 90 — see
          // resolveTradUpDurationDays). Admin changes durationDays for future
          // activations via PATCH /admin/plans/trad-up; existing activations
          // keep their snapshotted expiresAt.
          duration: 3,
          sortOrder: 1,
          visibility: PlanVisibility.LAUNCH,
          isFree: true,
          badgeText: 'Launch Offer',
          features: PLAN_FEATURES['trad-up'] || [],
          upgradeRules: { allowedUpgrades: ['trade-smart-launch'] },
          gracePeriodDays: 7,
          metadata: { launchPhase: 'v1', maxProducts: 5, gocashEnabled: false, premiumBadge: false, priorityRanking: false, campaignRewards: false, referralRewards: false, aiFeatures: false, durationDays: 90 },
        },
      });
      await this.prisma.planFeature.createMany({
        data: (PLAN_FEATURES['trad-up'] || []).map((f, i) => ({ planId: 'trad-up', feature: f, included: true, sortOrder: i })),
      });
      results.push({ planId: 'trad-up', action: 'created' });
    } else {
      results.push({ planId: 'trad-up', action: 'already exists' });
    }

    if (!existingTradeSmart) {
      await this.prisma.membershipPlan.create({
        data: {
          planId: 'trade-smart-launch',
          name: 'Trade Smart™',
          description: 'Everything in TRAD UP™ plus GOCASH, Premium Badge, Priority Ranking, Advanced Analytics and more.',
          pricePlanA: 12000,
          pricePlanB: 24000,
          pricePlanC: 36000,
          duration: 12,
          sortOrder: 2,
          visibility: PlanVisibility.LAUNCH,
          isFree: false,
          badgeText: 'Best Value',
          features: PLAN_FEATURES['trade-smart-launch'] || [],
          gracePeriodDays: 15,
          renewalRules: { autoRenew: true, graceDays: 15 },
          metadata: { launchPhase: 'v1', maxProducts: 25, gocashEnabled: true, premiumBadge: true, priorityRanking: true, campaignRewards: true, referralRewards: true, aiFeatures: false },
        },
      });
      await this.prisma.planFeature.createMany({
        data: (PLAN_FEATURES['trade-smart-launch'] || []).map((f, i) => ({ planId: 'trade-smart-launch', feature: f, included: true, sortOrder: i })),
      });
      results.push({ planId: 'trade-smart-launch', action: 'created' });
    } else {
      results.push({ planId: 'trade-smart-launch', action: 'already exists' });
    }

    return { message: 'Launch plans seeded', results };
  }

  async seedPlans() {
    // Canonical rows live in seed-data.ts (single source shared with E2E).
    const plans = CORE_PLANS;

    const results: any[] = [];

    for (const p of plans) {
      const existing = await this.prisma.membershipPlan.findUnique({ where: { planId: p.planId } });

      if (existing) {
        // Idempotent: never duplicate. Only normalize visibility so the plan becomes
        // visible through the production plan-selection flow (getPlans exposes LAUNCH/PUBLIC).
        await this.prisma.membershipPlan.update({
          where: { planId: p.planId },
          data: { visibility: PlanVisibility.PUBLIC },
        });
      } else {
        await this.prisma.membershipPlan.create({
          data: {
            ...p,
            description: `${p.name} membership plan`,
            visibility: PlanVisibility.PUBLIC,
            duration: 12,
            features: PLAN_FEATURES[p.planId] || [],
          },
        });
      }

      // Ensure plan feature rows exist (PlanFeature is the table consumed by
      // plan comparison / feature preview / purchase pages).
      const featureNames = PLAN_FEATURES[p.planId] || [];
      if (featureNames.length > 0) {
        const existingFeatures = await this.prisma.planFeature.findMany({
          where: { planId: p.planId },
          select: { feature: true },
        });
        const present = new Set(existingFeatures.map((f) => f.feature));
        const missing = featureNames.filter((f) => !present.has(f));
        if (missing.length > 0) {
          await this.prisma.planFeature.createMany({
            data: missing.map((f, i) => ({
              planId: p.planId,
              feature: f,
              included: true,
              sortOrder: i,
            })),
          });
        }
      }

      results.push({ planId: p.planId, action: existing ? 'exists' : 'created' });
    }

    // Backfill machine-readable entitlement rows (Part 1 foundation). Never
    // overwrites existing keys — admin edits via features/batch are preserved.
    const entitlementSeed = await this.seedPlanEntitlements();

    // Backfill v1 plan versions (D-1 approved foundation). Never overwrites
    // existing versions; existing subscribers keep working (nullable refs).
    const versionBackfill = await this.backfillPlanVersions();

    return { message: `Plans seeded (${plans.length} core plans)`, results, entitlements: entitlementSeed, versions: versionBackfill };
  }

  /**
   * Seed canonical entitlement rows (plan-entitlements.ts matrix) for the six
   * plans. Idempotent per (planId, feature-key): existing keys are NEVER
   * overwritten, so admin customizations survive reseeds. Safe to call
   * standalone or as the seedPlans() tail.
   */
  async seedPlanEntitlements() {
    const { SIX_PLAN_IDS, PLAN_ENTITLEMENT_MATRIX, PLAN_ENTITLEMENT_KEYS } = await import('./plan-entitlements');
    const keyMeta = new Map(PLAN_ENTITLEMENT_KEYS.map((k) => [k.key, k]));
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < SIX_PLAN_IDS.length; i++) {
      const planId = SIX_PLAN_IDS[i];
      const existing = await this.prisma.planFeature.findMany({
        where: { planId },
        select: { feature: true },
      });
      const present = new Set(existing.map((f) => f.feature));

      for (let s = 0; s < PLAN_ENTITLEMENT_MATRIX.length; s++) {
        const row = PLAN_ENTITLEMENT_MATRIX[s];
        if (present.has(row.key)) {
          skipped++;
          continue;
        }
        const meta = keyMeta.get(row.key);
        await this.prisma.planFeature.create({
          data: {
            planId,
            category: meta?.category ?? 'entitlements',
            feature: row.key,
            included: row.included[i],
            value: row.value[i],
            sortOrder: 100 + s,
          },
        });
        created++;
      }
    }

    return { created, skipped };
  }

  /**
   * D-1 approved v1 backfill: for every existing MembershipPlan row, create
   * exactly one version-1 snapshot from currently recoverable data (row
   * prices/duration/flags + PlanFeature rows) — ONLY when the plan has no
   * version yet. Never overwrites, never fabricates history: pre-edit terms
   * are NOT recoverable and are NOT reconstructed (see D-1 audit §9).
   * Existing subscribers are untouched (no Company/PlanHistory writes here;
   * version refs stay NULL until a future cutover assigns them).
   */
  async backfillPlanVersions() {
    const plans = await this.prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    let created = 0;
    let skipped = 0;
    for (const plan of plans) {
      const latest = await this.prisma.membershipPlanVersion.findFirst({
        where: { planId: plan.planId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      if (latest) {
        skipped++;
        continue;
      }

      const features = await this.prisma.planFeature.findMany({
        where: { planId: plan.planId },
        orderBy: { sortOrder: 'asc' },
      });

      await this.prisma.membershipPlanVersion.create({
        data: {
          planId: plan.planId,
          version: 1,
          status: plan.visibility,
          pricePlanA: plan.pricePlanA,
          pricePlanB: plan.pricePlanB,
          pricePlanC: plan.pricePlanC,
          duration: plan.duration,
          isFree: plan.isFree,
          badgeText: plan.badgeText,
          features: features.map((f) => ({
            feature: f.feature,
            category: f.category,
            included: f.included,
            value: f.value,
            sortOrder: f.sortOrder,
          })),
        },
      });
      created++;
    }

    return { created, skipped };
  }

  /**
   * Resolve a plan's machine-readable entitlements: { key: { included, value } }.
   * Reads PlanFeature rows (structured keys from plan-entitlements.ts plus any
   * admin-added keys, including `ai_credits` owned by AiCreditsService).
   * Unknown/foreign keys pass through raw; known keys keep stored values.
   */
  async getPlanEntitlements(planId: string): Promise<EntitlementMap> {
    const rows = await this.prisma.planFeature.findMany({
      where: { planId },
      orderBy: { sortOrder: 'asc' },
    });
    const map: EntitlementMap = {};
    for (const r of rows) {
      if (!(r.feature in map)) {
        map[r.feature] = { included: r.included, value: r.value };
      }
    }
    return map;
  }

  /**
   * Resolve the effective entitlements for a company — the single canonical
   * version-aware resolver (Part 2B-1). Precedence (evidence-based):
   *   1. valid currentPlanVersionId → purchased version snapshot (authoritative;
   *      live PlanFeature values are NEVER consulted — grandfathering);
   *   2. existing canonical subscription/plan relationship (currentPlanId,
   *      then legacy enum) → live rows (pre-cutover subscribers, unchanged);
   *   3. trade_start fallback (mirrors checkMembershipLimit's convention).
   * A dangling version ref (row deleted) falls through to (2)/(3) — never
   * fabricated, never an error for reads.
   */
  async getCompanyEntitlements(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { currentPlanId: true, subscriptionPlan: true, currentPlanVersionId: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    if (company.currentPlanVersionId) {
      const version = await this.prisma.membershipPlanVersion.findUnique({
        where: { id: company.currentPlanVersionId },
      });
      if (version) {
        const { versionFeaturesToMap } = await import('./plan-entitlements');
        return {
          planId: version.planId,
          versionId: version.id,
          version: version.version,
          entitlements: versionFeaturesToMap(version.features),
        };
      }
    }

    const enumToPlanId: Record<string, string> = {
      TRADE_START: 'trade_start',
      TRADE_SMART: 'trade_smart',
      TRADE_PLUS: 'trade_plus',
      TRADE_PRO: 'trade_pro',
      TRADE_PREMIUM: 'trade_premium',
      TRADE_ELITE: 'trade_elite',
    };
    const planId =
      company.currentPlanId ||
      (company.subscriptionPlan ? enumToPlanId[company.subscriptionPlan] || 'trade_start' : 'trade_start');

    return { planId, entitlements: await this.getPlanEntitlements(planId) };
  }

  /**
   * Resolve the version a NEW acquisition should attach: latest PUBLIC
   * version, falling back to latest LAUNCH version (covers LAUNCH-visibility
   * plans such as trad-up), honoring the effective window. DRAFT/ARCHIVED
   * versions are never served to new subscribers. Returns null when no
   * acquirable version exists — callers must leave the ref unset (legacy
   * fallback preserved), never fabricate one.
   */
  async getActivePlanVersion(planId: string, client?: Prisma.TransactionClient | PrismaService) {
    const db = client ?? this.prisma;
    const now = new Date();
    const window = { effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] };
    return (
      (await db.membershipPlanVersion.findFirst({
        where: { planId, status: PlanVisibility.PUBLIC, ...window },
        orderBy: { version: 'desc' },
      })) ??
      (await db.membershipPlanVersion.findFirst({
        where: { planId, status: PlanVisibility.LAUNCH, ...window },
        orderBy: { version: 'desc' },
      }))
    );
  }

  /**
   * Numeric convenience: allowance for `key` on a company's plan, or
   * `fallback` when the key is absent. `included:false` resolves to 0,
   * "unlimited" resolves to Infinity.
   */
  async getEntitlementLimit(companyId: string, key: string, fallback: number): Promise<number> {
    const { entitlementLimit } = await import('./plan-entitlements');
    const { entitlements } = await this.getCompanyEntitlements(companyId);
    return entitlementLimit(entitlements, key, fallback);
  }

  /**
   * P2A customer-facing comparison: deterministic assembly of the canonical
   * entitlement matrix + presentation copy. Pure read path — no DB, no auth
   * context, no legacy PlanFeature rows involved.
   */
  async getEntitlementMatrix() {
    const { buildComparisonMatrix } = await import('./plan-entitlements');
    return buildComparisonMatrix();
  }

  /**
   * 2B-2B enforcement fork (canonical): the resolved version snapshot iff
   * the company is version-pinned (currentPlanVersionId points at a live
   * row); null for legacy subscribers (NULL ref or dangling row).
   * Enforcement sites use the snapshot when non-null and keep their legacy
   * behavior verbatim otherwise — pre-cutover subscribers can never be
   * tightened by the newly-seeded matrix values.
   */
  async getVersionedEntitlements(companyId: string): Promise<EntitlementMap | null> {
    const resolution = await this.getCompanyEntitlements(companyId);
    if ('versionId' in resolution && resolution.versionId) return resolution.entitlements;
    return null;
  }

  /**
   * 2B-2B flexible-pricing enforcement: price-slab count cap from the
   * version snapshot (`price_tiers`; "advanced" → Infinity). Legacy
   * subscribers (null) keep unlimited slabs verbatim. An update to an
   * existing product is never blocked merely because its current slab count
   * already exceeds a reduced cap: the effective allowance is
   * max(snapshot, existingCount).
   */
  async enforcePriceTierLimit(companyId: string, newCount: number, existingCount = 0): Promise<void> {
    const snap = await this.getVersionedEntitlements(companyId);
    if (!snap || !('price_tiers' in snap)) return;
    const { entitlementLimit } = await import('./plan-entitlements');
    const max = entitlementLimit(snap, 'price_tiers', Infinity);
    if (newCount > Math.max(max, existingCount)) {
      throw new BadRequestException(
        `Plan allows a maximum of ${max === Infinity ? 'unlimited' : max} price slab(s) per product`,
      );
    }
  }

  // Map a planId (lowercase, frontend representation) to its canonical PlanType enum.
  // One consistent representation across plan selection → enrollment → membership.
  // P0-2 remediation: launch plans (trad-up, trade-smart-launch) are NOT PlanType enum
  // members (extending the enum would require a Prisma migration — deliberately out of
  // this wave). Their canonical identity is carried by Company.currentPlanId (free-form
  // string), with Company.subscriptionPlan/SubscriptionEvent.planType left NULL — both
  // fields are nullable by schema, so no schema change is needed. resolvePlanTypeOrNullOrThrow
  // is the single resolution point: core plans → enum value; known launch plans → null
  // (legal, identity preserved elsewhere); unknown plans → hard failure BEFORE any
  // payment capture, never after.
  private static readonly CORE_PLAN_TYPE_MAP: Record<string, PlanType> = {
    trade_start: PlanType.TRADE_START,
    trade_smart: PlanType.TRADE_SMART,
    trade_plus: PlanType.TRADE_PLUS,
    trade_pro: PlanType.TRADE_PRO,
    trade_premium: PlanType.TRADE_PREMIUM,
    trade_elite: PlanType.TRADE_ELITE,
  };

  private static readonly LAUNCH_PLAN_IDS = new Set(['trad-up', 'trade-smart-launch']);

  // ── TRAD UP final business policy (founder-locked) ─────────────────────
  // TRAD UP is TRADINGO's free promotional/trial plan:
  //   1. ONE PAN = ONE TRADINGO identity, lifetime (see auth.service PAN guards).
  //   2. ONE PAN receives the TRAD UP benefit ONLY ONCE per lifetime
  //      (server-side, history-anchored — see assertTradUpLifetimeEligible).
  //   3. Default duration 90 DAYS — single canonical constant below, never
  //      hardcoded anywhere else in the API.
  //   4. Admin override for FUTURE activations via the plan row's
  //      metadata.durationDays (existing canonical plan mechanism:
  //      PATCH /admin/plans/trad-up { metadata: { durationDays: N } }).
  //      Existing activations keep their snapshotted expiresAt/durationDays —
  //      an admin change never retroactively alters them.
  // MembershipPlan.duration stays a MONTHS display/back-compat field; the
  // authoritative TRAD UP term is days (metadata → constant → snapshot).
  private static readonly TRAD_UP_PLAN_ID = 'trad-up';
  private static readonly TRAD_UP_DEFAULT_DURATION_DAYS = 90;
  private static readonly TRAD_UP_DURATION_DAYS_MIN = 1;
  private static readonly TRAD_UP_DURATION_DAYS_MAX = 3650;

  // Resolve the TRAD UP term for a NEW activation: validated
  // metadata.durationDays when present, otherwise the 90-day default.
  private resolveTradUpDurationDays(plan: { planId: string; metadata?: unknown }): { days: number; source: 'plan-metadata' | 'trad-up-default' } {
    const meta = (plan as { metadata?: unknown })?.metadata;
    const raw = meta && typeof meta === 'object' ? (meta as Record<string, unknown>).durationDays : undefined;
    const parsed = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
    if (
      typeof parsed === 'number' &&
      Number.isInteger(parsed) &&
      parsed >= MembershipService.TRAD_UP_DURATION_DAYS_MIN &&
      parsed <= MembershipService.TRAD_UP_DURATION_DAYS_MAX
    ) {
      return { days: parsed, source: 'plan-metadata' };
    }
    return { days: MembershipService.TRAD_UP_DEFAULT_DURATION_DAYS, source: 'trad-up-default' };
  }

  // ONE PAN → ONE TRAD UP BENEFIT, lifetime. Server-side gate for
  // activateFreePlan: resolves the company's canonical PAN (Company.panNumber
  // is the F9-established legal source of truth) and rejects when ANY company
  // sharing that PAN — including soft-deleted ones (no deletedAt filter, so
  // delete/re-register cannot reset the clock) — has EVER consumed TRAD UP.
  // Lifetime consumption = any PlanHistory row with planId 'trad-up' (every
  // free activation writes one transactionally; enrollTrial can never mint
  // one since toPlanType throws for launch ids before any write).
  // Fail-closed: a lookup failure propagates and blocks activation.
  // Companies without a PAN anchor skip this gate (per-company idempotency
  // above still applies); the anchor binds on PAN declaration via the
  // auth-service PAN guards.
  private async assertTradUpLifetimeEligible(
    db: Prisma.TransactionClient | PrismaService,
    companyId: string,
    panNumber: string | null | undefined,
  ): Promise<void> {
    const panKey = (panNumber ?? '').trim().toUpperCase();
    if (!panKey) return;
    const siblings = (await db.company.findMany({
      where: { panNumber: { equals: panKey, mode: 'insensitive' } },
      select: { id: true },
    })) ?? [];
    const companyIds = [companyId, ...siblings.map((s) => s.id)];
    const prior = (await db.planHistory.findMany({
      where: { companyId: { in: companyIds }, planId: MembershipService.TRAD_UP_PLAN_ID },
      take: 1,
      select: { id: true },
    })) ?? [];
    if (prior.length > 0) {
      throw new BadRequestException('TRAD UP free benefit has already been consumed for this PAN and cannot be activated again');
    }
  }

  private toPlanType(planId: string): PlanType {
    const normalized = planId.trim().toLowerCase();
    const planType = MembershipService.CORE_PLAN_TYPE_MAP[normalized];
    if (!planType) {
      throw new BadRequestException(`Plan '${planId}' is not supported for subscription enrollment`);
    }
    return planType;
  }

  // P0-2: single plan-type resolution point for subscription writes. Returns the enum
  // value for core plans, or null for the two known launch plans (identity preserved
  // via currentPlanId / SubscriptionEvent metadata). Throws for anything else so an
  // unmappable plan can NEVER be activated — and the throw now happens before payment
  // capture commits (see verifySubscriptionPayment transaction).
  private resolvePlanTypeOrNullOrThrow(planId: string): PlanType | null {
    const normalized = planId.trim().toLowerCase();
    if (MembershipService.CORE_PLAN_TYPE_MAP[normalized]) return MembershipService.CORE_PLAN_TYPE_MAP[normalized];
    if (MembershipService.LAUNCH_PLAN_IDS.has(normalized)) return null;
    throw new BadRequestException(`Plan '${planId}' is not supported for subscription enrollment`);
  }

  // P0-2: validation-only variant used at order-creation time to fail fast (before a
  // gateway order exists) for any planId that could never activate.
  private ensurePlanResolvable(planId: string): void {
    this.resolvePlanTypeOrNullOrThrow(planId);
  }

  async getCurrentSubscription(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionActivatedAt: true,
        subscriptionExpiresAt: true,
        status: true,
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // P0-6 remediation: legacy `createOrder` (order computation without a gateway order)
  // and `processPayment` (PENDING payment creation with client-supplied amount) were
  // removed together with their only callers — the retired /plans/vendor/purchase
  // mock checkout endpoints. The canonical subscription payment path is
  // PaymentService.createSubscriptionGatewayOrder + verifySubscriptionPayment.

  async confirmPayment(companyId: string, paymentId: string, gatewayPaymentId: string, gatewaySignature: string) {
    // P0-8 remediation: ownership + HMAC + status-guarded, idempotent, transactional confirmation.

    // 1. Load the payment scoped to the authenticated user's company (ownership).
    //    findFirst on { id, companyId } -> cross-tenant paymentId simply looks "not found" (404).
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    // 2. Cryptographic verification via the canonical Razorpay integration.
    //    The signed payload is the gateway order id | gateway payment id (Razorpay checkout handler contract).
    const gatewayOrderId = payment.gatewayOrderId;
    if (!gatewayOrderId) {
      throw new BadRequestException('Payment has no gateway order reference; cannot verify');
    }
    const isValidSignature = this.razorpayService.verifyPayment({
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
    });
    if (!isValidSignature) {
      this.logger.warn(`Payment confirmation rejected: invalid gateway signature (payment ${payment.id})`);
      throw new BadRequestException('Payment verification failed — signature mismatch');
    }

    // 3. Idempotency: an already-CAPTURED payment with this gatewayPaymentId is confirmed; return existing state.
    //    Terminal failed/refunded states are never resurrected into success.
    if (payment.status === 'CAPTURED') {
      if (payment.gatewayPaymentId === gatewayPaymentId) {
        const existingInvoice = await this.prisma.invoice.findUnique({
          where: { paymentId: payment.id },
          select: { invoiceNumber: true },
        });
        return { success: true, paymentId: payment.id, invoiceNumber: existingInvoice?.invoiceNumber || null, idempotent: true };
      }
      throw new BadRequestException('Payment already confirmed with a different gateway payment id');
    }
    if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') {
      throw new BadRequestException(`Payment cannot be confirmed from status ${payment.status}`);
    }

    // 4. Order/payment consistency: the signature is bound to THIS payment's gateway order
    //    (verified in step 2 via payment.gatewayOrderId), so a signature for an unrelated
    //    order cannot confirm this payment. Amount/currency/plan are taken from the stored
    //    payment row (never from the client request).

    // 5. Transactional confirmation: capture + activation + invoice commit atomically.
    //    (Amount representation is preserved EXACTLY as the existing canonical path expects —
    //    no unit conversion added in this remediation.)
    const notes = (payment.notes as any) || {};

    const result = await this.prisma.$transaction(async (tx) => {
      const captured = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          gatewayPaymentId,
          gatewaySignature,
          paidAt: new Date(),
        },
      });

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await tx.company.update({
        where: { id: captured.companyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: notes.planId as any,
          currentPlanId: notes.planId as string,
          subscriptionActivatedAt: now,
          subscriptionExpiresAt: expiresAt,
          status: 'ACTIVE',
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          companyId: captured.companyId,
          status: 'ACTIVE',
          planType: notes.planId as any,
          metadata: {
            paymentId: captured.id,
            orderId: notes.orderId,
            planTier: notes.planTier,
            amount: captured.amount,
          },
        },
      });

      await tx.planHistory.create({
        data: {
          companyId: captured.companyId,
          planId: notes.planId as any || 'unknown',
          changeType: 'RENEWAL',
          toStatus: 'ACTIVE',
          amount: captured.amount,
          metadata: { paymentId: captured.id, orderId: notes.orderId, planTier: notes.planTier },
        },
      });

      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${uuid().slice(0,6).toUpperCase()}`;
      await tx.invoice.create({
        data: {
          invoiceNumber,
          companyId: captured.companyId,
          paymentId: captured.id,
          subtotal: captured.amount,
          totalAmount: captured.amount,
          currency: captured.currency,
          status: 'PAID',
          issuedAt: now,
          paidAt: now,
        },
      });

      return { success: true, paymentId: captured.id, invoiceNumber };
    });

    return result;
  }

  async handleWebhook(gateway: string, rawBody: string, signature: string) {
    this.logger.log(`Webhook from ${gateway}`);
    const secretKey = `WEBHOOK_SECRET_${gateway.toUpperCase()}`;
    const webhookSecret = this.configService.get<string>(secretKey);
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else if (webhookSecret && !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    let payload: any;
    try { payload = JSON.parse(rawBody); } catch { payload = {}; }
    if (payload.event === 'payment.captured' || payload.event === 'payment.success') {
      const paymentId = payload.paymentId || payload.id;
      if (paymentId) {
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'CAPTURED', paidAt: new Date() },
        });
      }
    }
    return { received: true };
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { planId: slug },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async validateCoupon(code: string, planId: string, companyId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.usedCount >= coupon.maxUsage) throw new BadRequestException('Coupon usage limit reached');

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) throw new BadRequestException('Coupon expired');

    if (coupon.applicablePlanIds) {
      const plans: string[] = coupon.applicablePlanIds as any;
      if (!plans.includes(planId)) throw new BadRequestException('Coupon not applicable for this plan');
    }

    const existingRedemption = await this.prisma.couponRedemption.findFirst({
      where: { couponId: coupon.id, companyId },
    });
    if (existingRedemption) throw new BadRequestException('Coupon already used by this company');

    return {
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minAmount: coupon.minAmount,
    };
  }

  async validateReferral(code: string, refereeCompanyId: string) {
    const referral = await this.prisma.referral.findUnique({ where: { code } });
    if (!referral) throw new NotFoundException('Referral code not found');
    if (referral.status !== 'PENDING') throw new BadRequestException('Referral code already used');
    if (referral.refereeCompanyId && referral.refereeCompanyId !== refereeCompanyId) {
      throw new BadRequestException('Referral code already assigned');
    }
    const referrer = await this.prisma.company.findUnique({ where: { id: referral.referrerCompanyId } });
    if (!referrer) throw new NotFoundException('Referrer company not found');

    return {
      valid: true,
      referrerName: referrer.name,
      rewardAmount: referral.rewardAmount,
      rewardType: referral.rewardType,
    };
  }

  async getPlanHistory(companyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.planHistory.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.planHistory.count({ where: { companyId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancelSubscription(companyId: string, reason?: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'ACTIVE') throw new BadRequestException('No active subscription');

    const previousPlan = company.subscriptionPlan;

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'CANCELLED',
        subscriptionPlan: null,
        currentPlanId: null,
        subscriptionActivatedAt: null,
        subscriptionExpiresAt: null,
        status: 'ACTIVE',
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId,
        status: 'CANCELLED',
        planType: previousPlan,
        metadata: { reason, cancelledAt: new Date().toISOString() },
      },
    });

    await this.prisma.planHistory.create({
      data: {
        companyId,
        planId: previousPlan as any || 'unknown',
        changeType: 'CANCEL',
        fromStatus: 'ACTIVE',
        toStatus: 'CANCELLED',
        metadata: { reason },
      },
    });

    return { success: true, message: 'Subscription cancelled' };
  }

  // P0-2 remediation: activateSubscription now threads an optional Prisma transaction
  // client (the same pattern enrollTrial has used since inception) so the verify path
  // and the webhook can make capture → activation → invoice ATOMIC. Every write below
  // goes through the provided client (tx when transacted, prisma when standalone).
  // Plan-type resolution uses resolvePlanTypeOrNullOrThrow: core plans get their enum
  // value; launch plans (trad-up / trade-smart-launch) intentionally carry identity via
  // currentPlanId with a nullable subscriptionPlan (no enum falsification).
  async activateSubscription(
    data: {
      companyId: string;
      planId: string;
      planTier: string;
      amount: number;
      paymentId: string;
      duration?: number;
    },
    client?: Prisma.TransactionClient | PrismaService,
  ) {
    const db = client ?? this.prisma;

    const now = new Date();
    const months = (data.duration || 1) * 12;
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const planType = this.resolvePlanTypeOrNullOrThrow(data.planId);

    // Part 2B-1: attach the currently acquirable plan version (if any) so the
    // new subscription resolves to its intended version going forward. Purely
    // additive reference write — amounts, dates, plan identity, GST and invoice
    // behavior below are untouched. When no acquirable version exists the field
    // is left alone (legacy fallback preserved; nothing fabricated).
    const activeVersion = await this.getActivePlanVersion(data.planId, db);

    await db.company.update({
      where: { id: data.companyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: planType,
        currentPlanId: data.planId,
        ...(activeVersion ? { currentPlanVersionId: activeVersion.id } : {}),
        subscriptionActivatedAt: now,
        subscriptionExpiresAt: expiresAt,
        status: 'ACTIVE',
      },
    });

    await db.subscriptionEvent.create({
      data: {
        companyId: data.companyId,
        status: 'ACTIVE',
        planType,
        metadata: {
          paymentId: data.paymentId,
          planTier: data.planTier,
          amount: data.amount,
          planId: data.planId,
        },
      },
    });

    await db.planHistory.create({
      data: {
        companyId: data.companyId,
        planId: data.planId,
        changeType: 'RENEWAL',
        toStatus: 'ACTIVE',
        amount: data.amount,
        metadata: { paymentId: data.paymentId, planTier: data.planTier },
      },
    });

    const planNames: Record<string, string> = {
      trade_start: 'Trade Start', trade_smart: 'Trade Smart', trade_plus: 'Trade Plus',
      trade_pro: 'Trade Pro', trade_premium: 'Trade Premium', trade_elite: 'Trade Elite',
      'trad-up': 'TRAD UP™', 'trade-smart-launch': 'Trade Smart™ Launch',
    };

    // Determine intra-state vs inter-state for GST (GST Rule 46(b)).
    // isDelhiIntraState() accepts full state names, 2-digit codes, or GSTINs.
    // Fails closed to inter-state (IGST) when buyer state cannot be resolved.
    const sellerStateCode = this.configService.get<string>('seller.stateCode') || '07';
    const [buyerLocation, buyerCompany] = await Promise.all([
      db.companyLocation.findFirst({
        where: { companyId: data.companyId, type: 'HEAD_OFFICE', deletedAt: null },
        orderBy: { isPrimary: 'desc' },
      }),
      db.company.findUnique({
        where: { id: data.companyId },
        select: { gstNumber: true },
      }),
    ]);

    // Prefer GSTIN prefix for state resolution; fall back to location.state name
    const buyerStateInput = buyerCompany?.gstNumber || buyerLocation?.state;
    const isIntraState = isDelhiIntraState(buyerStateInput, sellerStateCode);

    const invoice = await this.invoiceService.createSubscriptionInvoice({
      companyId: data.companyId,
      paymentId: data.paymentId,
      planId: data.planId,
      planName: planNames[data.planId] || data.planId,
      planTier: data.planTier,
      amount: data.amount,
      isIntraState,
      gstNumber: buyerCompany?.gstNumber || null,
    }, client);

    return { success: true, companyId: data.companyId, planId: data.planId, invoiceNumber: invoice.invoiceNumber };
  }

  async getInvoice(invoiceId: string) {
    return this.invoiceService.getInvoiceWithDetails(invoiceId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // P0-2 remediation: FREE-plan activation (TRAD UP™).
  //
  // A ₹0 plan must NEVER require a Razorpay order (the gateway rejects zero-amount
  // orders, which dead-ended the TRAD UP flow). This method activates a free plan
  // directly, transactionally, while preserving every existing control:
  //   - plan must exist, be active, and be isFree
  //   - launch plans (trad-up / trade-smart-launch) must pass the launch-mode gate
  //     — identical visibility semantics to getPlans()
  //   - one-activation-per-plan: idempotent if the company is ALREADY on this plan
  //   - plan-type resolution runs BEFORE any write, so an unmappable plan can never
  //     leave a half-activated state
  // TRAD UP final business policy (founder-locked, additive — paid-plan paths
  // untouched):
  //   - term is DAYS (metadata.durationDays override, else 90-day default —
  //     see resolveTradUpDurationDays), snapshotted per activation;
  //   - one PAN consumes the benefit once per lifetime (history-anchored,
  //     survives expiry/deletion/device/account changes);
  //   - expiry only flips subscriptionStatus to EXPIRED via the existing
  //     processor — the account, login and six-plan visibility are unaffected;
  //   - NEVER touches the payment gateway (₹0 path).
  // ─────────────────────────────────────────────────────────────────────────────
  async activateFreePlan(companyId: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (!plan.isActive) throw new BadRequestException('Plan is not available');
    if (!plan.isFree) throw new BadRequestException('Plan is not free; use the subscription purchase flow');

    // Launch-mode gate: while launch_mode is ON, only trad-up + trade-smart-launch are
    // selectable anywhere (getPlans()); while OFF, LAUNCH-visibility plans are hidden.
    // apply the same rule here so the free activation cannot bypass admin control.
    if (plan.visibility === PlanVisibility.LAUNCH) {
      const setting = await this.prisma.appSetting.findUnique({ where: { key: 'launch_mode' } });
      const launchModeOn = setting?.value === true || setting?.value === 'true';
      if (!launchModeOn) {
        throw new BadRequestException('This plan is currently not available');
      }
    }

    // Fail fast on plan-type resolution before any write.
    this.ensurePlanResolvable(plan.planId);

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    // Idempotency: already on this plan (and not expired) → no-op success.
    if (
      company.currentPlanId === plan.planId &&
      company.subscriptionStatus === 'ACTIVE' &&
      company.subscriptionExpiresAt &&
      company.subscriptionExpiresAt.getTime() > Date.now()
    ) {
      return { success: true, planId: plan.planId, status: 'ACTIVE', idempotent: true };
    }

    const isTradUp = plan.planId.trim().toLowerCase() === MembershipService.TRAD_UP_PLAN_ID;

    // One-PAN lifetime gate (TRAD UP only): a previous activation — even an
    // expired one, even on a sibling/deleted company sharing the PAN — blocks
    // a second benefit. Changing email/phone/device/account cannot reset it.
    if (isTradUp) {
      await this.assertTradUpLifetimeEligible(this.prisma, companyId, company.panNumber);
    }

    const now = new Date();
    let expiresAt: Date;
    let durationDays: number | null = null;
    let durationSource: string | null = null;
    if (isTradUp) {
      // TRAD UP term is days-based and snapshotted per activation: later admin
      // changes to metadata.durationDays govern NEW activations only.
      const resolved = this.resolveTradUpDurationDays(plan);
      durationDays = resolved.days;
      durationSource = resolved.source;
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + resolved.days);
    } else {
      // Duration semantics preserved EXACTLY from the paid activation path for
      // non-TRAD-UP free plans: MembershipPlan.duration is a MONTHS value.
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + (plan.duration || 6));
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const planType = this.resolvePlanTypeOrNullOrThrow(plan.planId);

      // Race-safe re-validation inside the write transaction: two concurrent
      // activations for the same PAN cannot both slip through the pre-check.
      if (isTradUp) {
        await this.assertTradUpLifetimeEligible(tx, companyId, company.panNumber);
      }

      // Part 2B-1: attach the currently acquirable plan version (if any).
      // Same additive, non-financial reference write as the paid path —
      // gates, amounts (₹0), dates and idempotency above are untouched.
      const activeVersion = await this.getActivePlanVersion(plan.planId, tx);

      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: planType,
          currentPlanId: plan.planId,
          ...(activeVersion ? { currentPlanVersionId: activeVersion.id } : {}),
          subscriptionActivatedAt: now,
          subscriptionExpiresAt: expiresAt,
          status: 'ACTIVE',
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          companyId,
          status: 'ACTIVE',
          planType,
          metadata: {
            planId: plan.planId,
            freeActivation: true,
            expiresAt: expiresAt.toISOString(),
            ...(isTradUp ? { durationDays, durationSource } : {}),
          },
        },
      });

      await tx.planHistory.create({
        data: {
          companyId,
          planId: plan.planId,
          changeType: 'RENEWAL',
          toStatus: 'ACTIVE',
          amount: 0,
          metadata: {
            freeActivation: true,
            previousPlanId: company.currentPlanId,
            ...(isTradUp ? { durationDays, durationSource, expiresAt: expiresAt.toISOString() } : {}),
          },
        },
      });

      return { success: true, planId: plan.planId, status: 'ACTIVE', expiresAt, ...(isTradUp ? { durationDays } : {}) };
    });

    return result;
  }

  // ── Trial Enrollment ──────────────────────────────────
  async enrollTrial(companyId: string, planId: string, client?: Prisma.TransactionClient | PrismaService) {
    const db = client ?? this.prisma;
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'TRIAL' && company.subscriptionStatus !== 'EXPIRED') {
      throw new BadRequestException('Company is not eligible for trial');
    }

    const plan = await db.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // Part 2B-2A: closed plans cannot start new enrollments (close-to-new).
    // LAUNCH plans stay enrollable (launch-gated flows such as TRADUP depend
    // on it); existing subscribers are unaffected (their rows are untouched).
    if (!plan.isActive || (plan.visibility !== PlanVisibility.PUBLIC && plan.visibility !== PlanVisibility.LAUNCH)) {
      throw new BadRequestException('Plan is not available for new enrollment');
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + (plan.trialPeriodDays || 14));

    // Part 2B-1/2B-2A: attach the currently acquirable plan version (if any).
    // Additive reference write only — eligibility, dates and trial semantics
    // above are untouched; absent version leaves the field alone (legacy path).
    const activeVersion = await this.getActivePlanVersion(planId, db);

    await db.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'TRIAL',
        subscriptionPlan: this.toPlanType(planId),
        currentPlanId: planId,
        ...(activeVersion ? { currentPlanVersionId: activeVersion.id } : {}),
        subscriptionActivatedAt: now,
        subscriptionExpiresAt: trialEnd,
      },
    });

    await db.subscriptionEvent.create({
      data: {
        companyId,
        status: 'TRIAL',
        planType: this.toPlanType(planId),
        metadata: { trialDays: plan.trialPeriodDays || 14, expiresAt: trialEnd.toISOString() },
      },
    });

    await db.planHistory.create({
      data: {
        companyId,
        planId,
        changeType: 'RENEWAL',
        toStatus: 'TRIAL',
        metadata: { trialDays: plan.trialPeriodDays || 14, expiresAt: trialEnd.toISOString() },
      },
    });

    return { success: true, status: 'TRIAL', trialEnd };
  }

  // ── Upgrade Subscription ──────────────────────────────
  async upgradeSubscription(companyId: string, newPlanId: string, planTier: string, amount: number, paymentId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { currentPlan: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'ACTIVE' && company.subscriptionStatus !== 'TRIAL') {
      throw new BadRequestException('No active subscription to upgrade');
    }

    const oldPlanId = company.subscriptionPlan as string || 'none';
    const proratedRefund = await this.calculateProratedRefund(company);

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionPlan: this.toPlanType(newPlanId),
        currentPlanId: newPlanId,
        subscriptionActivatedAt: new Date(),
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId,
        status: 'ACTIVE',
        planType: this.toPlanType(newPlanId),
        metadata: { upgradeFrom: oldPlanId, planTier, amount, paymentId, proratedRefund },
      },
    });

    await this.prisma.planHistory.create({
      data: {
        companyId,
        planId: newPlanId,
        changeType: 'UPGRADE',
        fromStatus: company.subscriptionStatus,
        toStatus: 'ACTIVE',
        amount,
        metadata: { oldPlanId, planTier, paymentId, proratedRefund },
      },
    });

    return { success: true, oldPlanId, newPlanId, proratedRefund };
  }

  // ── Downgrade Subscription ────────────────────────────
  async downgradeSubscription(companyId: string, newPlanId: string, effectiveAt?: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'ACTIVE') {
      throw new BadRequestException('No active subscription to downgrade');
    }

    const effective = effectiveAt ? new Date(effectiveAt) : new Date(company.subscriptionExpiresAt || new Date());

    await this.prisma.planHistory.create({
      data: {
        companyId,
        planId: newPlanId,
        changeType: 'DOWNGRADE',
        fromStatus: 'ACTIVE',
        toStatus: 'ACTIVE',
        metadata: { oldPlanId: company.subscriptionPlan, effectiveAt: effective.toISOString(), scheduled: true },
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId,
        status: 'ACTIVE',
        planType: this.toPlanType(newPlanId),
        metadata: { downgradeFrom: company.subscriptionPlan, effectiveAt: effective.toISOString(), scheduled: true },
      },
    });

    return { success: true, currentPlan: company.subscriptionPlan, requestedPlan: newPlanId, effectiveAt: effective.toISOString(), scheduled: true };
  }

  // ── Renew Subscription ────────────────────────────────
  async renewSubscription(companyId: string, amount: number, paymentId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'ACTIVE' && company.subscriptionStatus !== 'EXPIRED') {
      throw new BadRequestException('Subscription not eligible for renewal');
    }

    const planId = company.currentPlanId || company.subscriptionPlan as string;
    if (!planId) throw new BadRequestException('No plan associated with company');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionActivatedAt: now,
        subscriptionExpiresAt: expiresAt,
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId,
        status: 'ACTIVE',
        planType: this.toPlanType(planId),
        metadata: { action: 'renewal', amount, paymentId, expiresAt: expiresAt.toISOString() },
      },
    });

    await this.prisma.planHistory.create({
      data: {
        companyId,
        planId,
        changeType: 'RENEWAL',
        fromStatus: company.subscriptionStatus,
        toStatus: 'ACTIVE',
        amount,
        metadata: { paymentId, expiresAt: expiresAt.toISOString() },
      },
    });

    return { success: true, planId, expiresAt };
  }

  // ── Suspend Subscription ──────────────────────────────
  async suspendSubscription(companyId: string, reason: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'ACTIVE' && company.subscriptionStatus !== 'TRIAL') {
      throw new BadRequestException('Subscription is not active');
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: 'SUSPENDED' },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId,
        status: 'SUSPENDED',
        planType: company.subscriptionPlan,
        metadata: { reason, suspendedAt: new Date().toISOString() },
      },
    });

    await this.prisma.planHistory.create({
      data: {
        companyId,
        planId: company.subscriptionPlan as string || 'unknown',
        changeType: 'CANCEL',
        fromStatus: company.subscriptionStatus,
        toStatus: 'SUSPENDED',
        metadata: { reason },
      },
    });

    return { success: true, status: 'SUSPENDED', reason };
  }

  // ── Reactivate Subscription ───────────────────────────
  async reactivateSubscription(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus !== 'SUSPENDED' && company.subscriptionStatus !== 'EXPIRED') {
      throw new BadRequestException('Subscription is not in a reactivatable state');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionActivatedAt: now,
        subscriptionExpiresAt: expiresAt,
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId,
        status: 'ACTIVE',
        planType: company.subscriptionPlan,
        metadata: { action: 'reactivation', previousStatus: company.subscriptionStatus },
      },
    });

    await this.prisma.planHistory.create({
      data: {
        companyId,
        planId: company.subscriptionPlan as string || 'unknown',
        changeType: 'RENEWAL',
        fromStatus: company.subscriptionStatus,
        toStatus: 'ACTIVE',
        metadata: { action: 'reactivation' },
      },
    });

    return { success: true, status: 'ACTIVE', expiresAt };
  }

  // ── Get Detailed Subscription ─────────────────────────
  async getSubscriptionDetail(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionActivatedAt: true,
        subscriptionExpiresAt: true,
        subscriptionGraceStart: true,
        currentPlanId: true,
        currentPlan: {
          select: {
            planId: true, name: true, pricePlanA: true, pricePlanB: true, pricePlanC: true,
            duration: true, isFree: true, badgeText: true, features: true,
          },
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    const daysLeft = company.subscriptionExpiresAt
      ? Math.max(0, Math.ceil((company.subscriptionExpiresAt.getTime() - Date.now()) / 86400000))
      : 0;

    const recentEvents = await this.prisma.subscriptionEvent.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { ...company, daysLeft, recentEvents };
  }

  // ── Process Expired Subscriptions ─────────────────────
  async processExpiredSubscriptions() {
    const now = new Date();
    const expired = await this.prisma.company.findMany({
      where: {
        subscriptionExpiresAt: { lte: now, not: null },
        subscriptionStatus: { in: ['ACTIVE', 'TRIAL', 'SUSPENDED'] },
      },
    });

    const results = { expired: 0, graced: 0 };
    for (const company of expired) {
      const graceStart = company.subscriptionGraceStart
        ? new Date(company.subscriptionGraceStart)
        : null;
      const graceEnd = graceStart ? new Date(graceStart.getTime() + 7 * 86400000) : null;

      if (graceEnd && now < graceEnd) {
        continue;
      }

      await this.prisma.company.update({
        where: { id: company.id },
        data: { subscriptionStatus: 'EXPIRED' },
      });

      await this.prisma.subscriptionEvent.create({
        data: {
          companyId: company.id,
          status: 'EXPIRED',
          planType: company.subscriptionPlan,
          metadata: { expiredAt: now.toISOString(), previousStatus: company.subscriptionStatus },
        },
      });

      results.expired++;
    }

    return results;
  }

  // ── Admin: List All Subscriptions ────────────────────
  async adminGetAllSubscriptions(page = 1, limit = 20, filters?: { status?: string; planId?: string; search?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.status) where.subscriptionStatus = filters.status;
    if (filters?.planId) where.subscriptionPlan = filters.planId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: { subscriptionExpiresAt: { sort: 'asc', nulls: 'last' } },
        skip,
        take: limit,
        select: {
          id: true, name: true, email: true, slug: true,
          subscriptionStatus: true, subscriptionPlan: true,
          subscriptionActivatedAt: true, subscriptionExpiresAt: true,
          currentPlanId: true, trustScore: true, totalProducts: true,
          createdAt: true,
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: Subscription Summary ──────────────────────
  async adminGetSubscriptionSummary() {
    const [total, active, trial, expired, suspended, cancelled, revenue] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      this.prisma.company.count({ where: { subscriptionStatus: 'TRIAL' } }),
      this.prisma.company.count({ where: { subscriptionStatus: 'EXPIRED' } }),
      this.prisma.company.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
      this.prisma.company.count({ where: { subscriptionStatus: 'CANCELLED' } }),
      this.prisma.payment.aggregate({
        where: { type: 'SUBSCRIPTION', status: 'CAPTURED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      active,
      trial,
      expired,
      suspended,
      cancelled,
      totalSubscriptionRevenue: Number(revenue._sum.amount || 0) / 100,
    };
  }

  // ── Proration Calculator ──────────────────────────────
  private async calculateProratedRefund(company: any): Promise<number> {
    if (!company.subscriptionActivatedAt || !company.subscriptionExpiresAt) return 0;
    const totalMs = company.subscriptionExpiresAt.getTime() - company.subscriptionActivatedAt.getTime();
    const elapsedMs = Date.now() - company.subscriptionActivatedAt.getTime();
    const remainingRatio = Math.max(0, 1 - elapsedMs / totalMs);
    return Math.round(remainingRatio * 100);
  }
}
