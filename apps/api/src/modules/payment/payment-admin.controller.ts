import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentStatus, PaymentGateway } from '@prisma/client';

@ApiTags('Admin Payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/payments')
export class PaymentAdminController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all payments (admin)' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('gateway') gateway?: string,
    @Query('search') search?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (status) where.status = status;
    if (gateway) where.gateway = gateway;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { gatewayOrderId: { contains: search, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          company: { select: { id: true, name: true, email: true } },
          refunds: { select: { id: true, amount: true, status: true, createdAt: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Payment statistics (admin)' })
  async getStats() {
    const [total, captured, failed, pending, refunded, totalRevenue] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'CAPTURED' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'REFUNDED' } }),
      this.prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
    ]);

    return {
      total,
      captured,
      failed,
      pending,
      refunded,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  @Get('gateway-logs')
  @ApiOperation({ summary: 'Gateway webhook logs' })
  async getGatewayLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('gateway') gateway?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (gateway) where.gateway = gateway;

    const [data, total] = await Promise.all([
      this.prisma.processedWebhookEvent.findMany({
        where,
        orderBy: { processedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.processedWebhookEvent.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details (admin)' })
  async findOne(@Param('id') id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, email: true, mobile: true } },
        refunds: true,
        invoice: true,
      },
    });
    if (!payment) throw new Error('Payment not found');
    return payment;
  }
}
