import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/billing')
export class BillingAdminController {
  constructor(
    private readonly billingService: BillingService,
    private readonly invoiceService: InvoiceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices (admin)' })
  async getAllInvoices(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { planName: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          company: { select: { id: true, name: true, email: true } },
          items: true,
          taxBreakdown: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
  }

  @Post('invoices/:id/void')
  @ApiOperation({ summary: 'Void an invoice (admin only)' })
  async voidInvoice(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Query('adminId') adminId: string,
  ) {
    return this.invoiceService.voidInvoice(id, body.reason, adminId || 'admin');
  }

  @Get('reports/monthly')
  @ApiOperation({ summary: 'Monthly GST report (admin)' })
  async getMonthlyReport(@Query('year') year?: string) {
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const invoices = await this.prisma.invoice.findMany({
      where: {
        issuedAt: {
          gte: new Date(targetYear, 0, 1),
          lte: new Date(targetYear, 11, 31, 23, 59, 59),
        },
        status: { not: 'VOID' },
      },
      select: {
        totalAmount: true, taxAmount: true, cgstAmount: true,
        sgstAmount: true, igstAmount: true, issuedAt: true,
        planName: true, companyId: true,
      },
    });

    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const monthInvoices = invoices.filter(i => new Date(i.issuedAt).getMonth() === month);
      return {
        month: month + 1,
        invoiceCount: monthInvoices.length,
        totalRevenue: monthInvoices.reduce((s, i) => s + Number(i.totalAmount), 0),
        totalTax: monthInvoices.reduce((s, i) => s + Number(i.taxAmount || 0), 0),
        cgst: monthInvoices.reduce((s, i) => s + Number(i.cgstAmount || 0), 0),
        sgst: monthInvoices.reduce((s, i) => s + Number(i.sgstAmount || 0), 0),
        igst: monthInvoices.reduce((s, i) => s + Number(i.igstAmount || 0), 0),
      };
    });

    return { year: targetYear, monthly: monthlyData };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Billing statistics (admin)' })
  async getStats() {
    const [totalInvoices, totalRevenue, currentMonthRevenue] = await Promise.all([
      this.prisma.invoice.count({ where: { status: { not: 'VOID' } } }),
      this.prisma.invoice.aggregate({
        where: { status: { not: 'VOID' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: { not: 'VOID' },
          issuedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalInvoices,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      currentMonthRevenue: Number(currentMonthRevenue._sum.totalAmount || 0),
      currency: 'INR',
    };
  }
}
