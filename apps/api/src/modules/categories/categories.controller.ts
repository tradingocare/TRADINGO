import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateCategoryDto, @CurrentUser('sub') userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  @Get()
  @Public()
  async findAll(@Query() query: { cursor?: string; limit?: number; search?: string; isActive?: string }) {
    return this.categoriesService.findAll(query);
  }

  @Get('tree')
  @Public()
  async getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':slug/breadcrumbs')
  @Public()
  async getBreadcrumbs(@Param('slug') slug: string) {
    return this.categoriesService.getBreadcrumbs(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser('sub') userId: string) {
    return this.categoriesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.categoriesService.remove(id, userId);
  }
}
