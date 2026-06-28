import { Controller, Post, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { MembershipService } from '../membership/membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSubscriptionOrderDto, VerifySubscriptionPaymentDto } from './dto/subscription-order.dto';
import { v4 as uuid } from 'uuid';

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
