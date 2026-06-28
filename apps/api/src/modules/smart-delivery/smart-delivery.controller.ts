import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartDeliveryService } from './smart-delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDeliveryDto, ConfirmDeliveryDto, RejectDeliveryDto, UpdateDeliveryStatusDto, AddDeliveryDocumentDto } from './dto/smart-delivery.dto';

@ApiTags('Smart Delivery & Proof of Delivery')
@UseGuards(JwtAuthGuard)
@Controller('smart-delivery')
export class SmartDeliveryController {
  constructor(private readonly deliveryService: SmartDeliveryService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create delivery from shipment (seller)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createFromShipment(userId, dto);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm delivery with POD (buyer)' })
  confirm(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: ConfirmDeliveryDto) {
    return this.deliveryService.confirmDelivery(userId, id, dto);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject delivery (buyer)' })
  reject(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: RejectDeliveryDto) {
    return this.deliveryService.rejectDelivery(userId, id, dto);
  }

  @Post(':id/update-status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update delivery status' })
  updateStatus(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveryService.updateStatus(userId, id, dto.status as any, dto.note);
  }

  @Get('buyer')
  @ApiOperation({ summary: 'List buyer deliveries' })
  findByBuyer(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.deliveryService.findByBuyer(userId, status, page ?? 1, limit ?? 20);
  }

  @Get('seller')
  @ApiOperation({ summary: 'List seller deliveries' })
  findBySeller(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.deliveryService.findBySeller(userId, status, page ?? 1, limit ?? 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery details' })
  findById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveryService.findById(userId, id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get delivery timeline' })
  getTimeline(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveryService.getTimeline(userId, id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload delivery document (seller)' })
  addDocument(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: AddDeliveryDocumentDto) {
    return this.deliveryService.addDocument(userId, id, dto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get delivery documents' })
  getDocuments(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.deliveryService.getDocuments(userId, id);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  @Get('admin/analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin delivery analytics' })
  getAdminAnalytics() {
    return this.deliveryService.getAdminAnalytics();
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin list all deliveries' })
  adminFindAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.deliveryService.adminFindAll(page ?? 1, limit ?? 50, status);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin get delivery detail' })
  adminFindById(@Param('id') id: string) {
    return this.deliveryService.adminFindById(id);
  }
}
