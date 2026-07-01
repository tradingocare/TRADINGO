import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway, PlanVisibility } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { InvoiceService } from '../billing/invoice.service';
import { TaxService } from '../billing/tax.service';

const PLAN_FEATURES: Record<string, string[]> = {
  trade_start:   ['Buyer Visibility','GO Reach','Chat','RFQ (5/mo)','Basic Profile','1 Product','GOCASH Earning'],
  trade_smart:   ['Buyer Visibility','GO Reach','Chat','RFQ (20/mo)','Flexible Pricing','Direct Orders','25 Products','Seller Badge','Basic Profile','Website','GST Invoice'],
  trade_plus:    ['Buyer Visibility','GO Reach','Chat','RFQ (50/mo)','Flexible Pricing','Direct Orders','100 Products','Seller Badge','Branding','Business Profile','Website','Catalogue PDF','Basic Analytics'],
  trade_pro:     ['Buyer Visibility','GO Reach','Chat','RFQ (100/mo)','Flexible Pricing','Direct Orders','500 Products','Seller Badge','Branding','Business Profile','Website','Catalogue PDF','Analytics','Response Badge','GOCASH 2x'],
  trade_premium: ['Buyer Visibility','GO Reach','Chat','Unlimited RFQ','Flexible Pricing','Direct Orders','2000 Products','Seller Badge','Branding','Business Profile','Website','Catalogue PDF','Advanced Analytics','Relationship Manager','Featured Visibility','GOCASH 3x'],
  trade_elite:   ['Everything in Premium','Unlimited Products','Unlimited RFQs','TRADGO Elite','GO DIGITAL Featured','Price Lock','Advanced Analytics','GOCASH 3x','Priority RM','API Access','White Label Options','Custom Integration'],
  'trad-up':     ['Business Profile','Basic Verification','Product Listing (configurable)','Receive RFQs','Buyer Chat','Basic Search Visibility','Basic Dashboard','Basic Orders','Basic Notifications'],
  'trade-smart-launch': ['Business Profile','Basic Verification','Product Listing','Receive RFQs','Buyer Chat','Search Visibility','Basic Dashboard','Basic Orders','Basic Notifications','GOCASH Enabled','Premium Badge','Priority Search Ranking','Advanced Analytics','Campaign Participation','Referral Rewards','Exports','Advanced RFQ','Premium Dashboard'],
};

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
    @Inject(forwardRef(() => TaxService))
    private readonly taxService: TaxService,
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

    const plan = await this.prisma.membershipPlan.create({
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
          description: 'Launch Membership — Start selling on TRADINGO with zero investment. Valid for 6 months.',
          pricePlanA: 0,
          pricePlanB: 0,
          pricePlanC: 0,
          duration: 6,
          sortOrder: 1,
          visibility: PlanVisibility.LAUNCH,
          isFree: true,
          badgeText: 'Launch Offer',
          features: PLAN_FEATURES['trad-up'] || [],
          upgradeRules: { allowedUpgrades: ['trade-smart-launch'] },
          gracePeriodDays: 7,
          metadata: { launchPhase: 'v1', maxProducts: 5, gocashEnabled: false, premiumBadge: false, priorityRanking: false, campaignRewards: false, referralRewards: false, aiFeatures: false },
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
    const count = await this.prisma.membershipPlan.count();
    if (count > 0) return { message: 'Plans already seeded' };

    const plans = [
      { planId:'trade_start',   name:'Trade Start',  pricePlanA:6000,  pricePlanB:12000, pricePlanC:18000, sortOrder:1 },
      { planId:'trade_smart',   name:'Trade Smart',  pricePlanA:12000, pricePlanB:18000, pricePlanC:30000, sortOrder:2 },
      { planId:'trade_plus',    name:'Trade Plus',   pricePlanA:18000, pricePlanB:30000, pricePlanC:50000, sortOrder:3 },
      { planId:'trade_pro',     name:'Trade Pro',    pricePlanA:24000, pricePlanB:50000, pricePlanC:75000, sortOrder:4 },
      { planId:'trade_premium', name:'Trade Premium',pricePlanA:30000, pricePlanB:75000, pricePlanC:110000, sortOrder:5 },
      { planId:'trade_elite',   name:'Trade Elite',  pricePlanA:40000, pricePlanB:110000,pricePlanC:150000, sortOrder:6 },
    ];

    for (const p of plans) {
      await this.prisma.membershipPlan.create({
        data: {
          ...p,
          description: `${p.name} membership plan`,
          features: PLAN_FEATURES[p.planId] || [],
        },
      });
    }
    return { message: `${plans.length} plans seeded` };
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

  async createOrder(companyId: string, planId: string, planTier: string, duration: number) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const price = planTier === 'B' ? plan.pricePlanB : planTier === 'C' ? plan.pricePlanC : plan.pricePlanA;
    const totalAmount = price * duration;

    const orderId = `ORD-${uuid().slice(0, 8).toUpperCase()}`;

    return {
      orderId,
      planId: plan.planId,
      planName: plan.name,
      planTier,
      amount: totalAmount,
      currency: 'INR',
      duration,
      paymentStatus: 'PENDING',
    };
  }

  async processPayment(
    companyId: string,
    userId: string,
    orderId: string,
    gateway: PaymentGateway,
    paymentData: any,
  ) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        type: 'SUBSCRIPTION',
        gateway,
        status: 'PENDING',
        amount: paymentData.amount,
        currency: 'INR',
        description: `Membership: ${paymentData.planName} (${paymentData.planTier})`,
        gatewayOrderId: paymentData.gatewayOrderId,
        notes: { orderId, planId: paymentData.planId, planTier: paymentData.planTier },
      },
    });

    return payment;
  }

  async confirmPayment(paymentId: string, gatewayPaymentId: string, gatewaySignature: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CAPTURED',
        gatewayPaymentId,
        gatewaySignature,
        paidAt: new Date(),
      },
    });

    // Activate subscription on company
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const notes = (payment.notes as any) || {};

    await this.prisma.company.update({
      where: { id: payment.companyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: notes.planId as any,
        currentPlanId: notes.planId as string,
        subscriptionActivatedAt: now,
        subscriptionExpiresAt: expiresAt,
        status: 'ACTIVE',
      },
    });

    // Create subscription event
    await this.prisma.subscriptionEvent.create({
      data: {
        companyId: payment.companyId,
        status: 'ACTIVE',
        planType: notes.planId as any,
        metadata: {
          paymentId: payment.id,
          orderId: notes.orderId,
          planTier: notes.planTier,
          amount: payment.amount,
        },
      },
    });

    // Record plan history
    await this.prisma.planHistory.create({
      data: {
        companyId: payment.companyId,
        planId: notes.planId as any || 'unknown',
        changeType: 'RENEWAL',
        toStatus: 'ACTIVE',
        amount: payment.amount,
        metadata: { paymentId: payment.id, orderId: notes.orderId, planTier: notes.planTier },
      },
    });

    // Generate invoice
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${uuid().slice(0,6).toUpperCase()}`;
    await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: payment.companyId,
        paymentId: payment.id,
        subtotal: payment.amount,
        totalAmount: payment.amount,
        currency: payment.currency,
        status: 'PAID',
        issuedAt: now,
        paidAt: now,
      },
    });

    return { success: true, paymentId: payment.id, invoiceNumber };
  }

  async handleWebhook(gateway: string, payload: any) {
    this.logger.log(`Webhook from ${gateway}`);
    // Stub: In production, verify webhook signature
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

  async activateSubscription(data: {
    companyId: string;
    planId: string;
    planTier: string;
    amount: number;
    paymentId: string;
    duration?: number;
  }) {
    const now = new Date();
    const months = (data.duration || 1) * 12;
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await this.prisma.company.update({
      where: { id: data.companyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: data.planId as any,
        currentPlanId: data.planId,
        subscriptionActivatedAt: now,
        subscriptionExpiresAt: expiresAt,
        status: 'ACTIVE',
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        companyId: data.companyId,
        status: 'ACTIVE',
        planType: data.planId as any,
        metadata: {
          paymentId: data.paymentId,
          planTier: data.planTier,
          amount: data.amount,
        },
      },
    });

    await this.prisma.planHistory.create({
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
    };

    const invoice = await this.invoiceService.createSubscriptionInvoice({
      companyId: data.companyId,
      paymentId: data.paymentId,
      planId: data.planId,
      planName: planNames[data.planId] || data.planId,
      planTier: data.planTier,
      amount: data.amount,
      isIntraState: true,
    });

    return { success: true, companyId: data.companyId, planId: data.planId, invoiceNumber: invoice.invoiceNumber };
  }

  async getInvoice(invoiceId: string) {
    return this.invoiceService.getInvoiceWithDetails(invoiceId);
  }
}
