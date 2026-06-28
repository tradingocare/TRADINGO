import { Controller, Get, Post, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
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

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices for the company' })
  async getInvoices(
    @CurrentUser('sub') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const company = await this.resolveCompany(userId);
    return this.billingService.getInvoices(company.id, Number(page), Number(limit), { status, search });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const company = await this.resolveCompany(userId);
    const invoice = await this.billingService.getInvoice(id);
    if (invoice.companyId !== company.id) throw new Error('Invoice not found');
    return invoice;
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadInvoicePdf(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const company = await this.resolveCompany(userId);
    const invoice = await this.billingService.getInvoice(id);
    if (invoice.companyId !== company.id) throw new Error('Invoice not found');

    const { html, filename } = await this.billingService.getInvoicePdf(id);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get billing history timeline' })
  async getHistory(
    @CurrentUser('sub') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    const company = await this.resolveCompany(userId);
    return this.billingService.getBillingHistory(company.id, Number(page), Number(limit));
  }

  @Get('tax-summary')
  @ApiOperation({ summary: 'Get GST tax summary' })
  async getTaxSummary(
    @CurrentUser('sub') userId: string,
    @Query('year') year?: string,
  ) {
    const company = await this.resolveCompany(userId);
    return this.billingService.getTaxSummary(company.id, year ? Number(year) : undefined);
  }
}
