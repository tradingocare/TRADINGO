import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { ReviseQuoteDto } from './dto/revise-quote.dto';

@ApiTags('QUOTE')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/rfq/:rfqId/quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote (matched vendor only)' })
  async create(
    @Param('companyId') companyId: string,
    @Param('rfqId') rfqId: string,
    @Body() dto: CreateQuoteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.create(companyId, rfqId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all quotes for an RFQ (ranked for buyer)' })
  async findAll(
    @Param('companyId') companyId: string,
    @Param('rfqId') rfqId: string,
  ) {
    return this.quoteService.findAll(rfqId, companyId);
  }

  @Get(':quoteId')
  @ApiOperation({ summary: 'Get quote details' })
  async findById(
    @Param('companyId') companyId: string,
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.quoteService.findById(rfqId, quoteId, companyId);
  }

  @Patch(':quoteId')
  @ApiOperation({ summary: 'Update draft quote' })
  async update(
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.update(rfqId, quoteId, userId, dto);
  }

  @Post(':quoteId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit draft quote' })
  async submit(
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.submit(rfqId, quoteId, userId);
  }

  @Post(':quoteId/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw quote' })
  async withdraw(
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.withdraw(rfqId, quoteId, userId, reason);
  }

  @Post(':quoteId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a quote (buyer only)' })
  async accept(
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.accept(rfqId, quoteId, companyId, userId);
  }

  @Post(':quoteId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a quote (buyer only)' })
  async reject(
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
    @Param('companyId') companyId: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.reject(rfqId, quoteId, companyId, userId, reason);
  }

  @Post(':quoteId/revise')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revise quote (new version, max 5 revisions)' })
  async revise(
    @Param('rfqId') rfqId: string,
    @Param('quoteId') quoteId: string,
    @Body() dto: ReviseQuoteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.quoteService.revise(rfqId, quoteId, userId, dto);
  }
}
