import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { MembershipService } from '../membership/membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSubscriptionOrderDto, VerifySubscriptionPaymentDto } from './dto/subscription-order.dto';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@ApiTags('Subscription Payments')
@Controller('payment')
export class PaymentSubscriptionController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly membershipService: MembershipService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new Error('Company not found');
    return owner.company;
  }

  @Post('razorpay/order')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Razorpay order for subscription' })
  async createRazorpayOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSubscriptionOrderDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.paymentService.createSubscriptionGatewayOrder(company.id, userId, dto, 'RAZORPAY');
  }

  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Razorpay subscription payment' })
  async verifyRazorpayPayment(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifySubscriptionPaymentDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.paymentService.verifySubscriptionPayment(company.id, dto, 'RAZORPAY');
  }

  @Post('stripe/order')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe session for subscription' })
  async createStripeOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSubscriptionOrderDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.paymentService.createSubscriptionGatewayOrder(company.id, userId, dto, 'STRIPE');
  }

  @Get('lookup/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Look up subscription payment by ID' })
  async lookupPayment(
    @CurrentUser('sub') userId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const company = await this.resolveCompany(userId);
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId: company.id },
    });
    if (!payment) throw new Error('Payment not found');
    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      planId: (payment.notes as any)?.planId || null,
      paidAt: payment.paidAt,
    };
  }

  @Post('stripe/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Stripe subscription payment' })
  async verifyStripePayment(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifySubscriptionPaymentDto,
  ) {
    const company = await this.resolveCompany(userId);
    return this.paymentService.verifySubscriptionPayment(company.id, dto, 'STRIPE');
  }
}
