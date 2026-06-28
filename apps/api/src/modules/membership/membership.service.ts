import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGateway, PaymentStatus } from '@prisma/client';
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

  async getPlans() {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return plans;
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
