import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('Seller Brands')
@UseGuards(JwtAuthGuard)
@Controller('seller/brands')
export class BrandController {
  constructor(private readonly service: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'List company brands' })
  list(@CurrentUser('sub') userId: string) {
    return this.service.listBrands(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create brand' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBrandDto) {
    return this.service.createBrand(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brand' })
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.service.updateBrand(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brand' })
  delete(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.deleteBrand(userId, id);
  }
}
