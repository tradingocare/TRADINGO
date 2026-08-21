import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { CategoriesService } from './categories.service';
import { CategoryDemandService } from './category-demand.service';
import { CategoryDemandResult, TopCategoriesParams } from './dto/category-demand.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Throttle(RateLimits.MARKETPLACE_READ)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categoryDemandService: CategoryDemandService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateCategoryDto, @CurrentUser('sub') userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async findAll(@Query() query: { cursor?: string; limit?: number; search?: string; isActive?: string }) {
    return this.categoriesService.findAll(query);
  }

  /**
   * Get top categories ranked by demand score.
   *
   * This endpoint uses a single Prisma aggregation fetch and in-memory percentile
   * normalization to rank categories by composite demand score (sales × 0.40 +
   * RFQ × 0.10 + search × 0.15 + views × 0.20 + engagement × 0.10 + conversion × 0.05).
   *
   * No authentication required — public API for marketplace navigation and discovery.
   * Results are cached server-side (Redis key: categories:demand:v1, TTL 300s).
   *
   * @param limit Number of top categories to return (1-50, default 20)
   * @returns Ranked category data with scores, breakdown, and confidence
   */
  @Get('top')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Get top categories by demand score',
    description:
      'Returns categories ranked by composite demand score using weighted signals: sales (40%), RFQ (10%), search (15%), views (20%), engagement (10%), conversion (5%). ' +
      'Percentile normalization across all active categories. Cached for 5 minutes.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of top categories to return (1-50, default 20)',
    type: 'number',
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved top categories ranked by demand score',
    type: CategoryDemandResult,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid limit parameter',
  })
  async getTopCategories(
    @Query() params: TopCategoriesParams,
  ): Promise<CategoryDemandResult> {
    const limit = params.limit ?? 20;
    return this.categoryDemandService.getTopCategories(limit);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':slug/breadcrumbs')
  @ApiOperation({ summary: 'Get category breadcrumbs' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getBreadcrumbs(@Param('slug') slug: string) {
    return this.categoriesService.getBreadcrumbs(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser('sub') userId: string) {
    return this.categoriesService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.categoriesService.remove(id, userId);
  }
}