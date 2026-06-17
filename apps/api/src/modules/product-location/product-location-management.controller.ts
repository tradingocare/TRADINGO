import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductLocationService } from './product-location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BulkUpdateLocationDto, SellerProductLocationQueryDto, UpdateProductLocationDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Product Location Management')
@UseGuards(JwtAuthGuard)
@Controller('product-locations')
export class ProductLocationManagementController {
  constructor(
    private readonly service: ProductLocationService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCompanyId(userId: string): Promise<string> {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      select: { companyId: true },
    });
    if (!owner) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        return 'admin';
      }
      throw new Error('Company not found for user');
    }
    return owner.companyId;
  }

  @Get('seller')
  @ApiOperation({ summary: 'List seller products with location status' })
  async findSellerProducts(
    @CurrentUser('sub') userId: string,
    @Query() query: SellerProductLocationQueryDto,
  ) {
    const companyId = await this.resolveCompanyId(userId);
    return this.service.findByCompany(companyId, query);
  }

  @Patch('bulk')
  @ApiOperation({ summary: 'Bulk update locations for multiple products' })
  async bulkUpdate(
    @Body() dto: BulkUpdateLocationDto,
    @CurrentUser('sub') userId: string,
  ) {
    const companyId = await this.resolveCompanyId(userId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.productIds }, companyId },
      select: { id: true },
    });
    if (products.length !== dto.productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = dto.productIds.filter((id) => !found.has(id));
      throw new Error(`Products not found or not owned by you: ${missing.join(', ')}`);
    }
    return this.service.bulkUpdate(dto);
  }

  @Get('company-address')
  @ApiOperation({ summary: 'Get company default address for location copy' })
  async getCompanyAddress(@CurrentUser('sub') userId: string) {
    const companyId = await this.resolveCompanyId(userId);
    return this.service.getCompanyDefaultLocation(companyId);
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Update single product location' })
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductLocationDto,
    @CurrentUser('sub') userId: string,
  ) {
    const companyId = await this.resolveCompanyId(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { companyId: true },
    });
    if (!product || product.companyId !== companyId) {
      throw new Error('Product not found or not owned by you');
    }
    return this.service.update(productId, dto);
  }
}
