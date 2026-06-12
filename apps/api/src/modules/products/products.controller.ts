import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateProductDto, @CurrentUser('sub') userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Get()
  @Public()
  async findAll(@Query() query: {
    cursor?: string; limit?: number; search?: string;
    companyId?: string; categoryId?: string; industryId?: string;
    productType?: string; status?: string; isFeatured?: string;
  }) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @Public()
  async search(@Query('q') query: string,
    @Query('categoryId') categoryId?: string,
    @Query('industryId') industryId?: string,
    @Query('productType') productType?: string,
    @Query('companyId') companyId?: string,
    @Query('city') city?: string,
    @Query('state') state?: string) {
    return this.productsService.searchProducts(query, { categoryId, industryId, productType, companyId, city, state });
  }

  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser('sub') userId: string) {
    return this.productsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.productsService.remove(id, userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.publish(id, userId);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unpublish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.unpublish(id, userId);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.archive(id, userId);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async duplicate(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.duplicate(id, userId);
  }

  @Patch(':id/inventory')
  @UseGuards(JwtAuthGuard)
  async updateInventory(
    @Param('id') id: string,
    @Body('availableQuantity') availableQuantity: number,
    @Body('minimumThreshold') minimumThreshold: number,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productsService.updateInventory(id, availableQuantity, minimumThreshold, userId);
  }
}
