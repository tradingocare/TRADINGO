import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quotes')
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class MyQuotesController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get()
  @ApiOperation({ summary: 'List my quotes (seller)' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.quoteService.findMyQuotes(userId, parseInt(page), parseInt(limit));
  }

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin quote overview stats' })
  async getAdminOverview() {
    return this.quoteService.getAdminOverview();
  }

  @Get(':quoteId')
  @ApiOperation({ summary: 'Get my quote detail (seller)' })
  async findById(
    @Param('quoteId') quoteId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.findMyQuoteById(quoteId, userId);
  }
}
