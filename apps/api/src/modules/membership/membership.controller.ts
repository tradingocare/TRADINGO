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
  CreateOrderDto,
  ProcessPaymentDto,
  CancelSubscriptionDto,
  PlanHistoryQueryDto,
  EnrollTrialDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  RenewSubscriptionDto,
  SuspendSubscriptionDto,
  ReactivateSubscriptionDto,
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

  @Post('order')
  @ApiOperation({ summary: 'Create order' })
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @CurrentUser('sub') userId: string,
    @Body() body: CreateOrderDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.createOrder(company.id, body.planId, body.planTier, body.duration || 1);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Process payment' })
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @CurrentUser('sub') userId: string,
    @Body() body: ProcessPaymentDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.processPayment(company.id, userId, body.orderId, body.gateway as any, body.paymentData);
  }

  @Post('payment/confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  @UseGuards(JwtAuthGuard)
  confirmPayment(@Body() body: { paymentId: string; gatewayPaymentId: string; gatewaySignature: string }) {
    return this.membershipService.confirmPayment(body.paymentId, body.gatewayPaymentId, body.gatewaySignature);
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
  async getInvoice(@Param('id') id: string) {
    return this.membershipService.getInvoice(id);
  }

  @Post('trial')
  @ApiOperation({ summary: 'Enroll in trial' })
  @UseGuards(JwtAuthGuard)
  async enrollTrial(@CurrentUser('sub') userId: string, @Body() body: EnrollTrialDto) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.enrollTrial(company.id, body.planId);
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
