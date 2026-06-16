import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@ApiTags('Payments')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('order')
  @ApiOperation({ summary: 'Create a payment order (Razorpay order)' })
  async createPaymentOrder(
    @Param('companyId') companyId: string,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentService.createPaymentOrder(companyId, dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify payment after successful checkout' })
  async verifyPayment(
    @Param('companyId') companyId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyPayment(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments for a company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.paymentService.findAll(companyId, limit, cursor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.paymentService.findOne(companyId, id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  async createRefund(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.paymentService.createRefund(companyId, id, dto);
  }
}
