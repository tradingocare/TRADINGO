import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FinanceAggregatorService } from './aggregator.service';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

@ApiTags('Finance Operations')
@Controller('finance/ops')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class FinanceAggregatorController {
  constructor(private readonly aggregator: FinanceAggregatorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Finance ops dashboard cards' })
  getDashboardCards() { return this.aggregator.getDashboardCards(); }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue analytics with period support' })
  getRevenueAnalytics(
    @Query('period') period: string = 'monthly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) { return this.aggregator.getRevenueAnalytics(period, startDate, endDate); }

  @Get('settlements')
  @ApiOperation({ summary: 'Paginated settlements list' })
  getSettlements(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) { return this.aggregator.getSettlements(Number(page), Number(limit), status, search); }

  @Get('refunds')
  @ApiOperation({ summary: 'Paginated refunds list' })
  getRefunds(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) { return this.aggregator.getRefunds(Number(page), Number(limit), status); }

  @Get('disputes')
  @ApiOperation({ summary: 'Paginated disputes list with timeline' })
  getDisputes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) { return this.aggregator.getDisputes(Number(page), Number(limit), status); }

  @Get('commissions')
  @ApiOperation({ summary: 'Commission summary and rules' })
  getCommissions() { return this.aggregator.getCommissions(); }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Gateway → Escrow → Commission → Settlement reconciliation' })
  getReconciliation(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('bookingId') bookingId?: string,
  ) { return this.aggregator.getReconciliation(Number(page), Number(limit), bookingId); }

  @Get('search')
  @ApiOperation({ summary: 'Multi-entity financial search' })
  search(@Query('q') q: string) { return this.aggregator.search(q); }

  @Get('export/:entity')
  @ApiOperation({ summary: 'Export financial data as CSV' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async export(
    @Res() res: Response,
    @Param('entity') entity: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.aggregator.getExportData(entity, status, startDate, endDate);
    if (data.length === 0) {
      res.json({ data: [], message: 'No data to export' });
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}-export-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }
}
