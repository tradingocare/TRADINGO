import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreditNoteService } from './credit-notes.service';
import { CreateCreditNoteDto, CreateDebitNoteDto, QueryNoteDto } from './dto';

@ApiTags('Credit Notes')
@Throttle(RateLimits.WRITE_FINANCIAL)
@Controller('finance/credit-notes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class CreditNoteController {
  constructor(private readonly cnService: CreditNoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create credit note' })
  create(@Body() dto: CreateCreditNoteDto, @Req() req: any) { return this.cnService.createCreditNote(dto, req.user.id); }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue credit note' })
  issue(@Param('id') id: string) { return this.cnService.issueCreditNote(id); }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel credit note' })
  cancel(@Param('id') id: string, @Body('reason') reason: string) { return this.cnService.cancelCreditNote(id, reason); }

  @Get()
  @ApiOperation({ summary: 'List credit notes' })
  list(@Query() query: QueryNoteDto) { return this.cnService.listCreditNotes(query); }

  @Get('gst-summary')
  @ApiOperation({ summary: 'Get GST summary' })
  gstSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.cnService.getGstSummary(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
  }
}

@ApiTags('Debit Notes')
@Controller('finance/debit-notes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class DebitNoteController {
  constructor(private readonly cnService: CreditNoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create debit note' })
  create(@Body() dto: CreateDebitNoteDto, @Req() req: any) { return this.cnService.createDebitNote(dto, req.user.id); }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue debit note' })
  issue(@Param('id') id: string) { return this.cnService.issueDebitNote(id); }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel debit note' })
  cancel(@Param('id') id: string, @Body('reason') reason: string) { return this.cnService.cancelDebitNote(id, reason); }

  @Get()
  @ApiOperation({ summary: 'List debit notes' })
  list(@Query() query: QueryNoteDto) { return this.cnService.listDebitNotes(query); }
}
