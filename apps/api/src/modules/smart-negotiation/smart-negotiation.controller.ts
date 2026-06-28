import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartNegotiationService } from './smart-negotiation.service';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { StartNegotiationDto } from './dto/start-negotiation.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Smart Negotiation Engine')
@UseGuards(JwtAuthGuard)
@Controller('smart-negotiation')
export class SmartNegotiationController {
  constructor(private readonly negotiationService: SmartNegotiationService) {}

  @Post(':quoteId/start')
  @ApiOperation({ summary: 'Start negotiation on a quote' })
  start(@CurrentUser('sub') userId: string, @Param('quoteId') quoteId: string, @Body() dto: StartNegotiationDto) {
    return this.negotiationService.start(quoteId, userId, dto);
  }

  @Post(':id/counter')
  @ApiOperation({ summary: 'Submit a counter offer' })
  counter(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: CounterOfferDto) {
    return this.negotiationService.counter(id, userId, dto);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept the current offer' })
  accept(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.negotiationService.accept(id, userId);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject the negotiation' })
  reject(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.negotiationService.reject(id, userId, reason);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel the negotiation' })
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.negotiationService.cancel(id, userId, reason);
  }

  @Get()
  @ApiOperation({ summary: 'List my negotiations (buyer/seller)' })
  findAll(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.negotiationService.findAll(userId, status, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get negotiation detail' })
  findById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.negotiationService.findById(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history' })
  getVersions(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.negotiationService.getVersions(id, userId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get event timeline' })
  getTimeline(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.negotiationService.getTimeline(id, userId);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin negotiation overview stats' })
  getAdminOverview() {
    return this.negotiationService.getAdminOverview();
  }

  @Get('admin/negotiations')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin list all negotiations' })
  getAdminNegotiations(@Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.negotiationService.getAdminNegotiations(status, pagination);
  }

  @Get('admin/flagged')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin flagged negotiations' })
  getFlagged(@Query() pagination?: PaginationDto) {
    return this.negotiationService.getAdminFlagged(pagination);
  }

  @Get('admin/audit')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin negotiation audit trail' })
  getAudit(@Query() pagination?: PaginationDto) {
    return this.negotiationService.getAdminAudit(pagination);
  }
}
