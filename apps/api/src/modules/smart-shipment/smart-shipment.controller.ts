import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartShipmentService } from './smart-shipment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateShipmentDto, AssignCourierDto, UpdateShipmentDto, UpdateTrackingDto, AddDocumentDto } from './dto/smart-shipment.dto';

@ApiTags('Smart Shipment & Logistics Engine')
@UseGuards(JwtAuthGuard)
@Controller('smart-shipment')
export class SmartShipmentController {
  constructor(private readonly shipmentService: SmartShipmentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create shipment from a confirmed order (seller)' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateShipmentDto) {
    return this.shipmentService.create(userId, dto);
  }

  @Post(':id/assign-courier')
  @HttpCode(200)
  @ApiOperation({ summary: 'Assign courier and tracking number (seller)' })
  assignCourier(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: AssignCourierDto) {
    return this.shipmentService.assignCourier(userId, id, dto);
  }

  @Post(':id/update-status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update shipment status' })
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    return this.shipmentService.updateStatus(userId, id, dto.status as any, dto.note, dto.location);
  }

  @Get('buyer')
  @ApiOperation({ summary: 'List buyer shipments' })
  findByBuyer(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shipmentService.findByBuyer(userId, status, page ?? 1, limit ?? 20);
  }

  @Get('seller')
  @ApiOperation({ summary: 'List seller shipments' })
  findBySeller(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shipmentService.findBySeller(userId, status, page ?? 1, limit ?? 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment details' })
  findById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.shipmentService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipment details (seller)' })
  updateShipment(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentService.updateShipment(userId, id, dto);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get shipment timeline' })
  getTimeline(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.shipmentService.getTimeline(userId, id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload shipment document (seller)' })
  addDocument(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: AddDocumentDto) {
    return this.shipmentService.addDocument(userId, id, dto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get shipment documents' })
  getDocuments(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.shipmentService.getDocuments(userId, id);
  }

  @Get('performance/metrics')
  @ApiOperation({ summary: 'Shipment performance metrics (on-time rate, avg transit time, failure rate)' })
  getPerformanceMetrics(@CurrentUser('sub') userId: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.shipmentService.getUserCompany(userId).then((c) => this.shipmentService.getPerformanceMetrics(c.id, startDate, endDate));
  }

  @Get('delivery/performance')
  @ApiOperation({ summary: 'Delivery performance metrics (confirmation rate, avg delivery time)' })
  getDeliveryMetrics(@CurrentUser('sub') userId: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.shipmentService.getUserCompany(userId).then((c) => this.shipmentService.getDeliveryMetrics(c.id, startDate, endDate));
  }

  @Get('courier-providers')
  @ApiOperation({ summary: 'List active courier providers' })
  getCourierProviders() {
    return this.shipmentService.getCourierProviders();
  }

  @Post('seed-couriers')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seed default courier providers' })
  seedCouriers() {
    return this.shipmentService.seedCourierProviders();
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  @Get('admin/analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin shipment analytics' })
  getAdminAnalytics() {
    return this.shipmentService.getAdminAnalytics();
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin list all shipments' })
  adminFindAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.shipmentService.adminFindAll(page ?? 1, limit ?? 50, status);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin get shipment detail' })
  adminFindById(@Param('id') id: string) {
    return this.shipmentService.adminFindById(id);
  }
}
