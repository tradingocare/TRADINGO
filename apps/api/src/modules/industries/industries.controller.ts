import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { IndustriesService } from './industries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

@Controller('industries')
export class IndustriesController {
  constructor(private readonly industriesService: IndustriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateIndustryDto, @CurrentUser('sub') userId: string) {
    return this.industriesService.create(dto, userId);
  }

  @Get()
  @Public()
  async findAll(@Query() query: { cursor?: string; limit?: number; search?: string }) {
    return this.industriesService.findAll(query);
  }

  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.industriesService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateIndustryDto, @CurrentUser('sub') userId: string) {
    return this.industriesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.industriesService.remove(id, userId);
  }
}
