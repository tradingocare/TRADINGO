import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ReviewsService } from './reviews.service';
import { WishlistService } from './wishlist.service';
import { QaService } from './qa.service';
import { BestsellerService } from './bestseller.service';
import { BestsellerQueryDto } from './dto/bestseller-query.dto';
import { TrendingQueryDto, TopCategoriesQueryDto, TopSellersQueryDto, NearMeQueryDto } from './dto/ranking-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Products')
@Throttle(RateLimits.MARKETPLACE_READ)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ReviewsService,
    private readonly wishlistService: WishlistService,
    private readonly qaService: QaService,
    private readonly bestsellerService: BestsellerService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveProductId(slug: string): Promise<string> {
    const product = await this.prisma.product.findUnique({ where: { slug }, select: { id: true, companyId: true } });
    if (!product) throw new NotFoundException('Product not found');
    return product.id;
  }

  private async resolveProduct(slug: string): Promise<{ id: string; companyId: string }> {
    const product = await this.prisma.product.findUnique({ where: { slug }, select: { id: true, companyId: true } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async create(@Body() dto: CreateProductDto, @CurrentUser('sub') userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @Public()
  async findAll(@Query() query: {
    cursor?: string; limit?: number; search?: string;
    companyId?: string; categoryId?: string; industryId?: string;
    productType?: string; status?: string; isFeatured?: string;
  }) {
    return this.productsService.findAll(query);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'List all products (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminFindAll(@Query('search') search?: string, @Query('status') status?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    const p = parseInt(page);
    const l = parseInt(limit);
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l), hasNext: p * l < total, hasPrevious: p > 1 },
    };
  }

  @Get('companies/:companyId/products')
  @ApiOperation({ summary: 'Get products by company' })
  @UseGuards(JwtAuthGuard)
  async findByCompany(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findByCompany(companyId, { status, page, limit }, userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async search(@Query('q') query: string,
    @Query('categoryId') categoryId?: string,
    @Query('industryId') industryId?: string,
    @Query('productType') productType?: string,
    @Query('companyId') companyId?: string,
    @Query('city') city?: string,
    @Query('state') state?: string) {
    return this.productsService.searchProducts(query, { categoryId, industryId, productType, companyId, city, state });
  }

  @Get('bestsellers')
  @ApiOperation({ summary: 'Get bestseller products' })
  @Public()
  async getBestsellers(@Query(new ValidationPipe({ transform: true })) query: BestsellerQueryDto) {
    return this.bestsellerService.getBestsellers(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending products' })
  @Public()
  async getTrending(@Query(new ValidationPipe({ transform: true })) query: TrendingQueryDto) {
    return this.bestsellerService.getTrending(query);
  }

  @Get('categories/top')
  @ApiOperation({ summary: 'Get top categories' })
  @Public()
  async getTopCategories(@Query(new ValidationPipe({ transform: true })) query: TopCategoriesQueryDto) {
    return this.bestsellerService.getTopCategories(query);
  }

  @Get('sellers/top')
  @ApiOperation({ summary: 'Get top sellers' })
  @Public()
  async getTopSellers(@Query(new ValidationPipe({ transform: true })) query: TopSellersQueryDto) {
    return this.bestsellerService.getTopSellers(query);
  }

  @Get('near-me/top')
  @ApiOperation({ summary: 'Get top near-me products' })
  @Public()
  async getNearMeTop(@Query(new ValidationPipe({ transform: true })) query: NearMeQueryDto) {
    return this.bestsellerService.getNearMeTop(query);
  }

  @Get('lookup/:id')
  @ApiOperation({ summary: 'Look up product by ID for checkout' })
  @Public()
  async lookupById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser('sub') userId: string) {
    return this.productsService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.productsService.remove(id, userId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.publish(id, userId);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async unpublish(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.unpublish(id, userId);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.archive(id, userId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a product' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async duplicate(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.productsService.duplicate(id, userId);
  }

  @Patch(':id/inventory')
  @ApiOperation({ summary: 'Update product inventory' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async updateInventory(
    @Param('id') id: string,
    @Body('availableQuantity') availableQuantity: number,
    @Body('minimumThreshold') minimumThreshold: number,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productsService.updateInventory(id, availableQuantity, minimumThreshold, userId);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related products' })
  @Public()
  async getRelated(@Param('slug') slug: string, @Query('limit') limit?: number) {
    return this.productsService.findRelated(slug, limit);
  }

  @Get(':slug/reviews')
  @ApiOperation({ summary: 'Get product reviews' })
  @Public()
  async getReviews(@Param('slug') slug: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const productId = await this.resolveProductId(slug);
    return this.reviewsService.getReviews(productId, page, limit);
  }

  @Post(':slug/reviews')
  @ApiOperation({ summary: 'Create a product review' })
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser('sub') userId: string,
  ) {
    const product = await this.resolveProduct(slug);
    return this.reviewsService.createReview(product.id, userId, product.companyId, dto);
  }

  @Post(':slug/reviews/:id/helpful')
  @ApiOperation({ summary: 'Mark review as helpful' })
  @Public()
  @HttpCode(HttpStatus.OK)
  async markHelpful(@Param('id') reviewId: string) {
    return this.reviewsService.markHelpful(reviewId);
  }

  @Get(':slug/reviews/stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @Public()
  async getReviewStats(@Param('slug') slug: string) {
    const productId = await this.resolveProductId(slug);
    return this.reviewsService.getReviewStats(productId);
  }

  @Get(':slug/qa')
  @ApiOperation({ summary: 'Get product Q&A' })
  @Public()
  async getQuestions(@Param('slug') slug: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const productId = await this.resolveProductId(slug);
    return this.qaService.getQuestions(productId, page, limit);
  }

  @Post(':slug/qa')
  @ApiOperation({ summary: 'Ask a product question' })
  @UseGuards(JwtAuthGuard)
  async askQuestion(
    @Param('slug') slug: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser('sub') userId: string,
  ) {
    const productId = await this.resolveProductId(slug);
    return this.qaService.askQuestion(productId, userId, dto.question);
  }

  @Post(':slug/qa/:id/answer')
  @ApiOperation({ summary: 'Answer a product question' })
  @UseGuards(JwtAuthGuard)
  async answerQuestion(
    @Param('id') qaId: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser('sub') userId: string,
  ) {
    const companyOwner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      select: { companyId: true },
    });
    if (!companyOwner) throw new NotFoundException('Company not found for user');
    return this.qaService.answerQuestion(qaId, companyOwner.companyId, dto.answer);
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'Get user wishlist' })
  @UseGuards(JwtAuthGuard)
  async getWishlist(@CurrentUser('sub') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.wishlistService.getWishlist(userId, page, limit);
  }

  @Post('wishlist/:productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(
    @Param('productId') productId: string,
    @Body('notes') notes: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.wishlistService.addToWishlist(userId, productId, notes);
  }

  @Delete('wishlist/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @UseGuards(JwtAuthGuard)
  async removeFromWishlist(@Param('productId') productId: string, @CurrentUser('sub') userId: string) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Get('wishlist/:productId/check')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @UseGuards(JwtAuthGuard)
  async checkWishlist(@Param('productId') productId: string, @CurrentUser('sub') userId: string) {
    return this.wishlistService.isInWishlist(userId, productId);
  }
}
