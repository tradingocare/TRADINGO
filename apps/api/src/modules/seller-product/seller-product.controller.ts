import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellerProductService } from './seller-product.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductStatus } from '@prisma/client';

@ApiTags('Seller Products')
@UseGuards(JwtAuthGuard)
@Controller('seller/products')
export class SellerProductController {
  constructor(private readonly service: SellerProductService) {}

  @Get('status-counts')
  @ApiOperation({ summary: 'Get product count by status' })
  getStatusCounts(@CurrentUser('sub') userId: string) {
    return this.service.getStatusCounts(userId);
  }

  @Get()
  @ApiOperation({ summary: 'List seller products' })
  listProducts(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listProducts(userId, { status, search, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail' })
  getProduct(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.getProduct(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  createProduct(@CurrentUser('sub') userId: string, @Body() dto: any) {
    return this.service.createProduct(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  updateProduct(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateProduct(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  deleteProduct(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.deleteProduct(userId, id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit for approval' })
  submitForApproval(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.submitForApproval(userId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate product' })
  duplicateProduct(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.duplicateProduct(userId, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive product' })
  archiveProduct(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.archiveProduct(userId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore archived/deleted product' })
  restoreProduct(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.restoreProduct(userId, id);
  }

  @Post('bulk/status')
  @ApiOperation({ summary: 'Bulk status update' })
  bulkStatusUpdate(@CurrentUser('sub') userId: string, @Body() dto: { ids: string[]; status: ProductStatus }) {
    return this.service.bulkStatusUpdate(userId, dto.ids, dto.status);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete' })
  bulkDelete(@CurrentUser('sub') userId: string, @Body() dto: { ids: string[] }) {
    return this.service.bulkDelete(userId, dto.ids);
  }
}
