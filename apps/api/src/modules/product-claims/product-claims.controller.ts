import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductClaimsService } from './product-claims.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProductClaimDto } from './dto/create-product-claim.dto';
import { UpdateProductClaimDto } from './dto/update-product-claim.dto';

@ApiTags('Product Claims')
@UseGuards(JwtAuthGuard)
@Controller()
export class ProductClaimsController {
  constructor(private readonly productClaimsService: ProductClaimsService) {}

  @Get('products/masters/search')
  @Public()
  @ApiOperation({ summary: 'Search product masters' })
  async searchProductMasters(
    @Query('q') q: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productClaimsService.searchProductMasters(q, { categoryId, subcategoryId, page, limit });
  }

  @Post('companies/:companyId/product-claims')
  @ApiOperation({ summary: 'Create a product claim' })
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateProductClaimDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productClaimsService.create(companyId, dto, userId);
  }

  @Get('companies/:companyId/product-claims')
  @ApiOperation({ summary: 'List product claims for company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query('status') status?: string,
  ) {
    return this.productClaimsService.findAll(companyId, status);
  }

  @Get('companies/:companyId/product-claims/:id')
  @ApiOperation({ summary: 'Get product claim details' })
  async findById(@Param('id') id: string) {
    return this.productClaimsService.findById(id);
  }

  @Patch('companies/:companyId/product-claims/:id')
  @ApiOperation({ summary: 'Update a product claim' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductClaimDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productClaimsService.update(id, dto, userId);
  }

  @Post('companies/:companyId/product-claims/:id/submit')
  @ApiOperation({ summary: 'Submit product claim for approval' })
  async submit(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productClaimsService.submit(id, userId);
  }

  @Post('companies/:companyId/product-claims/:id/approve')
  @ApiOperation({ summary: 'Approve product claim (admin)' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productClaimsService.approve(id, userId);
  }

  @Post('companies/:companyId/product-claims/:id/reject')
  @ApiOperation({ summary: 'Reject product claim with reason' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productClaimsService.reject(id, reason, userId);
  }

  @Delete('companies/:companyId/product-claims/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a product claim' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.productClaimsService.remove(id, userId);
  }
}
