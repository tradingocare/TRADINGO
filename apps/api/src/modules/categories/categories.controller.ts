import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { CategoriesService } from './categories.service';
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
  constructor(private readonly categoriesService: CategoriesService) {}

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
