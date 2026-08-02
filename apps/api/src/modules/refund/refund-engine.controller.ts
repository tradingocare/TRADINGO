import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RefundEngineService } from './refund-engine.service';
import { ProcessBookingRefundDto, ManualRefundApprovalDto, BookingRefundResult } from './dto/refund-engine.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';

@Controller('refund')
@Throttle(RateLimits.ADMIN_WRITE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class RefundEngineController {
  constructor(
    private readonly refundEngineService: RefundEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('booking/:bookingId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async processBookingRefund(
    @Param('bookingId') bookingId: string,
    @Body() dto: ProcessBookingRefundDto,
    @CurrentUser('id') userId: string,
  ): Promise<BookingRefundResult> {
    return this.refundEngineService.processBookingRefund(
      bookingId,
      userId,
      dto.amount,
      dto.reason,
      dto.refundType || 'FULL',
    );
  }

  @Get('history')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getRefundHistory(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const where: any = { payment: { type: 'BOOKING_PAYMENT' } };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: { payment: { select: { id: true, amount: true, companyId: true, status: true, notes: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l), hasNext: p * l < total, hasPrevious: p > 1 },
    };
  }

  @Post('approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approveManualRefund(
    @Body() dto: ManualRefundApprovalDto,
    @CurrentUser('id') userId: string,
  ) {
    if (dto.decision === 'APPROVED') {
      const refund = await this.prisma.refund.update({
        where: { id: dto.refundId },
        data: { status: 'APPROVED' },
      });
      return { success: true, refund, message: 'Refund approved' };
    }
    const refund = await this.prisma.refund.update({
      where: { id: dto.refundId },
      data: { status: 'REJECTED', reason: dto.notes || 'Rejected by admin' },
    });
    return { success: true, refund, message: 'Refund rejected' };
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getRefundStats() {
    const totalRefunds = await this.prisma.refund.count({
      where: { payment: { type: 'BOOKING_PAYMENT' } },
    });
    const totalAmount = await this.prisma.refund.aggregate({
      where: { payment: { type: 'BOOKING_PAYMENT' } },
      _sum: { amount: true },
    });
    const pendingCount = await this.prisma.refund.count({
      where: { payment: { type: 'BOOKING_PAYMENT' }, status: { in: ['PENDING', 'PROCESSING'] } },
    });

    return {
      totalRefunds,
      totalAmount: totalAmount._sum.amount ?? 0,
      pendingCount,
    };
  }
}
