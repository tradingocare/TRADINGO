import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartRfqService } from './smart-rfq.service';
import { NearToFarService } from './near-to-far.service';
import { RfqSellerService } from './rfq-seller.service';
import { RfqAdminService } from './rfq-admin.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Smart RFQ Engine')
@UseGuards(JwtAuthGuard)
@Controller('smart-rfq')
export class SmartRfqController {
  constructor(
    private readonly rfqService: SmartRfqService,
    private readonly nearToFar: NearToFarService,
    private readonly sellerService: RfqSellerService,
    private readonly adminService: RfqAdminService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create RFQ from any source' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateRfqDto) {
    return this.rfqService.createFromSource(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my RFQs (buyer)' })
  findMy(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.rfqService.findMyRfqs(userId, status, pagination);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an RFQ' })
  duplicate(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.rfqService.duplicate(userId, id);
  }

  @Get(':id/suppliers')
  @ApiOperation({ summary: 'Near To Far™ supplier suggestions' })
  findSuppliers(@Param('id') id: string) {
    return this.nearToFar.findSuppliers(id);
  }

  @Get('near-to-far/stats')
  @ApiOperation({ summary: 'Near To Far™ matching stats' })
  getMatchingStats() {
    return this.nearToFar.getMatchingStats();
  }

  @Get('seller/incoming')
  @ApiOperation({ summary: 'List incoming RFQs (seller)' })
  getIncomingRfqs(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.getIncomingRfqs(c.id, status, pagination));
  }

  @Post('seller/:rfqId/accept')
  @HttpCode(204)
  @ApiOperation({ summary: 'Accept an RFQ (seller)' })
  acceptRfq(@CurrentUser('sub') userId: string, @Param('rfqId') rfqId: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.acceptRfq(rfqId, c.id));
  }

  @Post('seller/:rfqId/decline')
  @HttpCode(204)
  @ApiOperation({ summary: 'Decline an RFQ (seller)' })
  declineRfq(@CurrentUser('sub') userId: string, @Param('rfqId') rfqId: string, @Body('reason') reason?: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.declineRfq(rfqId, c.id, reason));
  }

  @Get('seller/stats')
  @ApiOperation({ summary: 'Seller RFQ stats' })
  getSellerStats(@CurrentUser('sub') userId: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.getRfqStats(c.id));
  }

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin RFQ overview stats' })
  getAdminOverview() {
    return this.adminService.getOverview();
  }

  @Get('admin/rfqs')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin list all RFQs' })
  getAdminRfqs(@Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.adminService.getRfqs(status, pagination);
  }

  @Get('admin/flagged')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin flagged RFQs' })
  getFlaggedRfqs(@Query() pagination?: PaginationDto) {
    return this.adminService.getFlaggedRfqs(pagination);
  }

  @Get('admin/audit-trail')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin RFQ audit trail' })
  getAuditTrail(@Query() pagination?: PaginationDto) {
    return this.adminService.getAuditTrail(pagination);
  }
}
