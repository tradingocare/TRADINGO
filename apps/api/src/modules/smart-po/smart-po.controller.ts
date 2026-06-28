import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartPoService } from './smart-po.service';
import { UpdatePoDto } from './dto/update-po.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('Smart Purchase Order Engine')
@UseGuards(JwtAuthGuard)
@Controller('smart-po')
export class SmartPoController {
  constructor(private readonly poService: SmartPoService) {}

  @Post(':negotiationId/generate')
  @ApiOperation({ summary: 'Generate purchase order from accepted negotiation' })
  generate(@CurrentUser('sub') userId: string, @Param('negotiationId') negotiationId: string) {
    return this.poService.generate(negotiationId, userId);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Buyer confirms the purchase order' })
  confirm(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.confirm(id, userId);
  }

  @Post(':id/seller-pending')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark PO as seller pending (system)' })
  markSellerPending(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.markSellerPending(id, userId);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seller accepts the purchase order' })
  accept(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.accept(id, userId);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject the purchase order' })
  reject(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.poService.reject(id, userId, reason);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel the purchase order' })
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.poService.cancel(id, userId, reason);
  }

  @Post(':id/request-revision')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request revision (seller)' })
  requestRevision(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('notes') notes: string) {
    return this.poService.requestRevision(id, userId, notes);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update / revise purchase order' })
  revise(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdatePoDto) {
    return this.poService.revise(id, userId, dto);
  }

  @Post(':id/lock')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lock the purchase order' })
  lock(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.lock(id, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List my purchase orders' })
  findAll(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.poService.findAll(userId, status, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order detail' })
  findById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.findById(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history' })
  getVersions(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.getVersions(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get event timeline' })
  getTimeline(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.poService.getTimeline(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Get purchase order PDF HTML' })
  async getPdf(@CurrentUser('sub') userId: string, @Param('id') id: string, @Res() res: Response) {
    const html = await this.poService.getPdfHtml(id);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="po-${id.slice(0, 8)}.html"`);
    res.send(html);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin PO overview stats' })
  getAdminOverview() {
    return this.poService.getAdminOverview();
  }

  @Get('admin/orders')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin list all purchase orders' })
  getAdminPos(@Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.poService.getAdminPos(status, pagination);
  }

  @Get('admin/flagged')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin flagged POs' })
  getFlagged(@Query() pagination?: PaginationDto) {
    return this.poService.getAdminFlagged(pagination);
  }

  @Get('admin/audit')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin PO audit trail' })
  getAudit(@Query() pagination?: PaginationDto) {
    return this.poService.getAdminAudit(pagination);
  }
}
