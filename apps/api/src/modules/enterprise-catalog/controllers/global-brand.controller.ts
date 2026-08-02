import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GlobalBrandService } from '../services/global-brand.service';
import { CreateGlobalBrandDto, UpdateGlobalBrandDto, QueryGlobalBrandDto } from '../dto/global-brand.dto';

@ApiTags('Global Brands')
@Controller('enterprise-catalog/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalBrandController {
  constructor(private readonly brandService: GlobalBrandService) {}

  @Post()
  @ApiOperation({ summary: 'Create a global brand' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  create(@Body() dto: CreateGlobalBrandDto, @CurrentUser() user: any) {
    return this.brandService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all global brands' })
  @Public()
  findAll(@Query() query: QueryGlobalBrandDto) {
    return this.brandService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @Public()
  findById(@Param('id') id: string) {
    return this.brandService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get brand by slug' })
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.brandService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a global brand' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateGlobalBrandDto, @CurrentUser() user: any) {
    return this.brandService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a global brand' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a global brand' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  verify(@Param('id') id: string, @CurrentUser() user: any) {
    return this.brandService.verify(id, user.id);
  }
}
