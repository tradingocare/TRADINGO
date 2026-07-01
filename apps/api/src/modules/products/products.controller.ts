import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus, NotFoundException, ValidationPipe } from '@nestjs/common';
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

  @Get('admin/all')
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

  @Get('bestsellers')
  @Public()
  async getBestsellers(@Query(new ValidationPipe({ transform: true })) query: BestsellerQueryDto) {
    return this.bestsellerService.getBestsellers(query);
  }

  @Get('trending')
  @Public()
  async getTrending(@Query(new ValidationPipe({ transform: true })) query: TrendingQueryDto) {
    return this.bestsellerService.getTrending(query);
  }

  @Get('categories/top')
  @Public()
  async getTopCategories(@Query(new ValidationPipe({ transform: true })) query: TopCategoriesQueryDto) {
    return this.bestsellerService.getTopCategories(query);
  }

  @Get('sellers/top')
  @Public()
  async getTopSellers(@Query(new ValidationPipe({ transform: true })) query: TopSellersQueryDto) {
    return this.bestsellerService.getTopSellers(query);
  }

  @Get('near-me/top')
  @Public()
  async getNearMeTop(@Query(new ValidationPipe({ transform: true })) query: NearMeQueryDto) {
    return this.bestsellerService.getNearMeTop(query);
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

  @Get(':slug/related')
  @Public()
  async getRelated(@Param('slug') slug: string, @Query('limit') limit?: number) {
    return this.productsService.findRelated(slug, limit);
  }

  @Get(':slug/reviews')
  @Public()
  async getReviews(@Param('slug') slug: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const productId = await this.resolveProductId(slug);
    return this.reviewsService.getReviews(productId, page, limit);
  }

  @Post(':slug/reviews')
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
  @Public()
  @HttpCode(HttpStatus.OK)
  async markHelpful(@Param('id') reviewId: string) {
    return this.reviewsService.markHelpful(reviewId);
  }

  @Get(':slug/reviews/stats')
  @Public()
  async getReviewStats(@Param('slug') slug: string) {
    const productId = await this.resolveProductId(slug);
    return this.reviewsService.getReviewStats(productId);
  }

  @Get(':slug/qa')
  @Public()
  async getQuestions(@Param('slug') slug: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const productId = await this.resolveProductId(slug);
    return this.qaService.getQuestions(productId, page, limit);
  }

  @Post(':slug/qa')
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
  @UseGuards(JwtAuthGuard)
  async getWishlist(@CurrentUser('sub') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.wishlistService.getWishlist(userId, page, limit);
  }

  @Post('wishlist/:productId')
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
  @UseGuards(JwtAuthGuard)
  async removeFromWishlist(@Param('productId') productId: string, @CurrentUser('sub') userId: string) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Get('wishlist/:productId/check')
  @UseGuards(JwtAuthGuard)
  async checkWishlist(@Param('productId') productId: string, @CurrentUser('sub') userId: string) {
    return this.wishlistService.isInWishlist(userId, productId);
  }
}
