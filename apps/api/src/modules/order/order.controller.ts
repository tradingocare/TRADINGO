import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrderDto, UpdateOrderDto, CancelOrderDto, CreateReturnDto, CreateOrderDocumentDto } from './dto/order.dto';
import { OrderStatus } from '@prisma/client';

@ApiTags('ORDERS')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateOrderDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.create(companyId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for buyer' })
  async findByBuyer(
    @Param('companyId') companyId: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findByBuyer(companyId, status, page ?? 1, limit ?? 20);
  }

  @Get('seller')
  @ApiOperation({ summary: 'List orders for seller' })
  async findBySeller(
    @Param('companyId') companyId: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findBySeller(companyId, status, page ?? 1, limit ?? 20);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get order analytics for company' })
  async getAnalytics(@Param('companyId') companyId: string) {
    return this.orderService.getAnalytics(companyId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details' })
  async findById(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.findById(orderId, companyId);
  }

  @Patch(':orderId')
  @ApiOperation({ summary: 'Update order details (seller)' })
  async updateOrder(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.updateOrder(orderId, companyId, userId, dto);
  }

  @Post(':orderId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm order (seller)' })
  async confirm(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.updateStatus(orderId, companyId, userId, 'CONFIRMED');
  }

  @Post(':orderId/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start processing (seller)' })
  async process(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.updateStatus(orderId, companyId, userId, 'PROCESSING');
  }

  @Post(':orderId/dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch order (seller)' })
  async dispatch(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.updateStatus(orderId, companyId, userId, 'DISPATCHED');
  }

  @Post(':orderId/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm delivery (buyer)' })
  async deliver(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.updateStatus(orderId, companyId, userId, 'DELIVERED');
  }

  @Post(':orderId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete order (buyer/seller)' })
  async complete(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.updateStatus(orderId, companyId, userId, 'COMPLETED');
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  async cancel(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.cancelOrder(orderId, companyId, userId, dto);
  }

  @Post(':orderId/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request return (buyer)' })
  async requestReturn(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateReturnDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.requestReturn(orderId, companyId, userId, dto);
  }

  @Get(':orderId/timeline')
  @ApiOperation({ summary: 'Get order timeline' })
  async getTimeline(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getTimeline(orderId, companyId);
  }

  @Post(':orderId/documents')
  @ApiOperation({ summary: 'Upload order document' })
  async uploadDocument(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateOrderDocumentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.uploadDocument(orderId, companyId, userId, dto);
  }

  @Get(':orderId/documents')
  @ApiOperation({ summary: 'Get order documents' })
  async getDocuments(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getDocuments(orderId, companyId);
  }

  @Post(':orderId/locations/:locationId/dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch a location (seller)' })
  async dispatchLocation(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @Param('locationId') locationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.dispatchLocation(orderId, locationId, companyId, userId);
  }

  @Post(':orderId/locations/:locationId/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm delivery for a location (buyer)' })
  async deliverLocation(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
    @Param('locationId') locationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.orderService.deliverLocation(orderId, locationId, companyId, userId);
  }

  @Get(':orderId/locations')
  @ApiOperation({ summary: 'Get location delivery statuses' })
  async getLocationStatus(
    @Param('companyId') companyId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.getLocationStatus(orderId, companyId);
  }
}
