import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartOrderService } from './smart-order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateOrderDto, CancelOrderDto, CreateReturnDto, UpdateStatusDto } from './dto/smart-order.dto';

@ApiTags('Smart Order Management Engine')
@UseGuards(JwtAuthGuard)
@Controller('smart-order')
export class SmartOrderController {
  constructor(private readonly orderService: SmartOrderService) {}

  @Post(':poId/create-from-po')
  @ApiOperation({ summary: 'Generate order from a LOCKED purchase order' })
  createFromPo(@CurrentUser('sub') userId: string, @Param('poId') poId: string) {
    return this.orderService.createFromPo(poId, userId);
  }

  @Get('buyer')
  @ApiOperation({ summary: 'List buyer orders' })
  findByBuyer(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findByBuyer(userId, status, page ?? 1, limit ?? 20);
  }

  @Get('seller')
  @ApiOperation({ summary: 'List seller orders' })
  findBySeller(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findBySeller(userId, status, page ?? 1, limit ?? 20);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get order analytics' })
  getAnalytics(@CurrentUser('sub') userId: string) {
    return this.orderService.getAnalytics(userId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details' })
  findById(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.orderService.findById(orderId, userId);
  }

  @Patch(':orderId')
  @ApiOperation({ summary: 'Update order details (seller)' })
  updateOrder(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.orderService.updateOrder(userId, orderId, dto);
  }

  @Post(':orderId/update-status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.orderService.updateStatus(userId, orderId, dto.status, dto.note);
  }

  @Post(':orderId/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel order' })
  cancel(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(userId, orderId, dto);
  }

  @Post(':orderId/return')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request return (buyer)' })
  requestReturn(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.orderService.requestReturn(userId, orderId, dto);
  }

  @Get(':orderId/timeline')
  @ApiOperation({ summary: 'Get order timeline' })
  getTimeline(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.orderService.getTimeline(userId, orderId);
  }

  @Get(':orderId/documents')
  @ApiOperation({ summary: 'Get order documents' })
  getDocuments(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.orderService.getDocuments(userId, orderId);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  @Get('admin/analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin order analytics' })
  getAdminAnalytics() {
    return this.orderService.getAdminAnalytics();
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin list all orders' })
  adminFindAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.orderService.adminFindAll(page ?? 1, limit ?? 50, status);
  }

  @Get('admin/:orderId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin get order detail' })
  adminFindById(@Param('orderId') orderId: string) {
    return this.orderService.adminFindById(orderId);
  }
}
