import { Controller, Get, Post, Param, Body, UseGuards, Headers, NotFoundException, Query } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  ValidateCouponDto,
  ValidateReferralDto,
  CreateOrderDto,
  ProcessPaymentDto,
  CancelSubscriptionDto,
  PlanHistoryQueryDto,
} from './membership.dto';

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
  @Public()
  getPlans() {
    return this.membershipService.getPlans();
  }

  @Get('plans/:slug')
  @Public()
  getPlanBySlug(@Param('slug') slug: string) {
    return this.membershipService.getPlanBySlug(slug);
  }

  @Post('plans/seed')
  @Public()
  seedPlans() {
    return this.membershipService.seedPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrent(@CurrentUser('sub') userId: string) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.getCurrentSubscription(company.id);
  }

  @Post('order')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @CurrentUser('sub') userId: string,
    @Body() body: CreateOrderDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.createOrder(company.id, body.planId, body.planTier, body.duration || 1);
  }

  @Post('payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @CurrentUser('sub') userId: string,
    @Body() body: ProcessPaymentDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.processPayment(company.id, userId, body.orderId, body.gateway as any, body.paymentData);
  }

  @Post('payment/confirm')
  @UseGuards(JwtAuthGuard)
  confirmPayment(@Body() body: { paymentId: string; gatewayPaymentId: string; gatewaySignature: string }) {
    return this.membershipService.confirmPayment(body.paymentId, body.gatewayPaymentId, body.gatewaySignature);
  }

  @Post('coupon/validate')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(
    @CurrentUser('sub') userId: string,
    @Body() body: ValidateCouponDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.validateCoupon(body.code, body.planId, company.id);
  }

  @Post('referral/validate')
  @UseGuards(JwtAuthGuard)
  async validateReferral(
    @CurrentUser('sub') userId: string,
    @Body() body: ValidateReferralDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.validateReferral(body.code, company.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @CurrentUser('sub') userId: string,
    @Query() query: PlanHistoryQueryDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.getPlanHistory(company.id, query.page, query.limit);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @CurrentUser('sub') userId: string,
    @Body() body: CancelSubscriptionDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.membershipService.cancelSubscription(company.id, body.reason);
  }

  @Post('webhook')
  @Public()
  handleWebhook(@Headers('x-gateway') gateway: string, @Body() body: any) {
    return this.membershipService.handleWebhook(gateway, body);
  }

  @Get('invoice/:id')
  @UseGuards(JwtAuthGuard)
  async getInvoice(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.membershipService.getInvoice(id);
  }
}
