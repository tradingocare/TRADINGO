import { Controller, Get, Post, Param, Body, UseGuards, Headers, NotFoundException, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { MembershipService } from './membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  ValidateCouponDto,
  ValidateReferralDto,
  CancelSubscriptionDto,
  PlanHistoryQueryDto,
  EnrollTrialDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  RenewSubscriptionDto,
  SuspendSubscriptionDto,
} from './membership.dto';

@ApiTags('Membership')
@Throttle(RateLimits.WRITE_FINANCIAL)
@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new NotFoundException('Company not found');
    return owner.company;
  }

  @Get('plans')
  @ApiOperation({ summary: 'List plans' })
  @Public()
  getPlans() {
    return this.membershipService.getPlans();
  }

  // Launch mode: only return LAUNCH-visibility plans
  @Get('plans/launch')
  @ApiOperation({ summary: 'List launch plans' })
  @Public()
  getLaunchPlans() {
    return this.membershipService.getLaunchPlans();
  }

  @Get('plans/:slug')
  @ApiOperation({ summary: 'Get plan by slug' })
  @Public()
  getPlanBySlug(@Param('slug') slug: string) {
    return this.membershipService.getPlanBySlug(slug);
  }

  // P2A: customer-facing six-plan comparison — canonical entitlement matrix.
  // Read-only, deterministic, no legacy PlanFeature rows involved.
  @Get('entitlement-matrix')
  @ApiOperation({ summary: 'Get canonical entitlement comparison matrix' })
  @Public()
  getEntitlementMatrix() {
    return this.membershipService.getEntitlementMatrix();
  }

  @Post('plans/seed')
  @ApiOperation({ summary: 'Seed plans' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  seedPlans() {
    return this.membershipService.seedPlans();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription' })
  @UseGuards(JwtAuthGuard)
  async getCurrent(@CurrentUser('sub') userId: string) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.getCurrentSubscription(company.id);
  }

  // P0-6 remediation: the legacy `POST /membership/order` and `POST /membership/payment`
  // endpoints were removed. They served only the retired /plans/vendor/purchase mock
  // checkout (apps/web/lib/payment/provider.ts), which could activate paid plans without
  // a verified gateway payment. Canonical purchase flow: /subscription/purchase ->
  // POST /payment/razorpay/order -> POST /payment/razorpay/verify (HMAC-verified).
  // The service methods (createOrder/processPayment) were dead weight for a removed
  // flow and are retired with their only callers.

  @Post('payment/confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  @UseGuards(JwtAuthGuard)
  confirmPayment(
    @CurrentUser('sub') userId: string,
    @Body() body: { paymentId: string; gatewayPaymentId: string; gatewaySignature: string },
  ) {
    // P0-8 remediation: resolveCompany enforces tenant ownership before the service
    // loads the payment (scoped by companyId), verifies the gateway HMAC, and
    // transitions state transactionally.
    return this.resolveCompany(userId)
      .then((company) =>
        this.membershipService.confirmPayment(company.id, body.paymentId, body.gatewayPaymentId, body.gatewaySignature),
      );
  }

  @Post('coupon/validate')
  @ApiOperation({ summary: 'Validate coupon' })
  @UseGuards(JwtAuthGuard)
  async validateCoupon(
    @CurrentUser('sub') userId: string,
    @Body() body: ValidateCouponDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.validateCoupon(body.code, body.planId, company.id);
  }

  @Post('referral/validate')
  @ApiOperation({ summary: 'Validate referral' })
  @UseGuards(JwtAuthGuard)
  async validateReferral(
    @CurrentUser('sub') userId: string,
    @Body() body: ValidateReferralDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.validateReferral(body.code, company.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get plan history' })
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @CurrentUser('sub') userId: string,
    @Query() query: PlanHistoryQueryDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.getPlanHistory(company.id, query.page, query.limit);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @CurrentUser('sub') userId: string,
    @Body() body: CancelSubscriptionDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.cancelSubscription(company.id, body.reason);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle payment webhook' })
  @Public()
  handleWebhook(@Req() req: any, @Headers('x-gateway') gateway: string) {
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'] || '';
    return this.membershipService.handleWebhook(gateway, rawBody, signature);
  }

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Get invoice' })
  @UseGuards(JwtAuthGuard)
  async getInvoice(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    // F3 Invoice IDOR remediation: ownership check before disclosure.
    // 404 (not 403) intentionally avoids invoice-existence disclosure.
    const company = await this.resolveCompany(userId);
    const invoice = await this.membershipService.getInvoice(id);
    if (!invoice || invoice.companyId !== company.id) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  @Post('trial')
  @ApiOperation({ summary: 'Enroll in trial' })
  @UseGuards(JwtAuthGuard)
  async enrollTrial(@CurrentUser('sub') userId: string, @Body() body: EnrollTrialDto) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.enrollTrial(company.id, body.planId);
  }

  // P0-2 remediation: free-plan (TRAD UP™) activation WITHOUT any gateway order.
  // ₹0 plans must not require Razorpay (zero-amount orders are rejected by the
  // gateway, which dead-ended the TRAD UP flow). Launch-mode visibility control
  // is enforced inside the service — admin can close the plan via launch_mode.
  @Post('activate-free')
  @ApiOperation({ summary: 'Activate a free plan (e.g. TRAD UP) — no payment required' })
  @UseGuards(JwtAuthGuard)
  async activateFreePlan(
    @CurrentUser('sub') userId: string,
    @Body() body: { planId: string },
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.activateFreePlan(company.id, body.planId);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription' })
  @UseGuards(JwtAuthGuard)
  async upgradeSubscription(@CurrentUser('sub') userId: string, @Body() body: UpgradeSubscriptionDto) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.upgradeSubscription(company.id, body.newPlanId, body.planTier, body.amount, body.paymentId);
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Downgrade subscription' })
  @UseGuards(JwtAuthGuard)
  async downgradeSubscription(@CurrentUser('sub') userId: string, @Body() body: DowngradeSubscriptionDto) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.downgradeSubscription(company.id, body.newPlanId, body.effectiveAt);
  }

  @Post('renew')
  @ApiOperation({ summary: 'Renew subscription' })
  @UseGuards(JwtAuthGuard)
  async renewSubscription(@CurrentUser('sub') userId: string, @Body() body: RenewSubscriptionDto) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.renewSubscription(company.id, body.amount, body.paymentId);
  }

  @Post('suspend')
  @ApiOperation({ summary: 'Suspend subscription' })
  @UseGuards(JwtAuthGuard)
  async suspendSubscription(@CurrentUser('sub') userId: string, @Body() body: SuspendSubscriptionDto) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.suspendSubscription(company.id, body.reason);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate subscription' })
  @UseGuards(JwtAuthGuard)
  async reactivateSubscription(@CurrentUser('sub') userId: string) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.reactivateSubscription(company.id);
  }

  @Get('detail')
  @ApiOperation({ summary: 'Get detailed subscription info' })
  @UseGuards(JwtAuthGuard)
  async getSubscriptionDetail(@CurrentUser('sub') userId: string) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.getSubscriptionDetail(company.id);
  }
}
