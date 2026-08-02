import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { IndustriesService } from './industries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

@ApiTags('Industries')
@Throttle(RateLimits.MARKETPLACE_READ)
@Controller('industries')
export class IndustriesController {
  constructor(private readonly industriesService: IndustriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new industry' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateIndustryDto, @CurrentUser('sub') userId: string) {
    return this.industriesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all industries' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async findAll(@Query() query: { cursor?: string; limit?: number; search?: string }) {
    return this.industriesService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get industry by slug' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async findBySlug(@Param('slug') slug: string) {
    return this.industriesService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an industry' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateIndustryDto, @CurrentUser('sub') userId: string) {
    return this.industriesService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an industry' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.industriesService.remove(id, userId);
  }
}
