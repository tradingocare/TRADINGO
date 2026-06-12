import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadGalleryImageDto } from './dto/upload-gallery-image.dto';
import { ReorderGalleryDto } from './dto/reorder-gallery.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Gallery')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @ApiOperation({ summary: 'Upload gallery image' })
  async upload(
    @Param('companyId') companyId: string,
    @Body() dto: UploadGalleryImageDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.galleryService.upload(companyId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gallery images' })
  async findAll(@Param('companyId') companyId: string) {
    return this.galleryService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gallery image by id' })
  async findById(@Param('id') id: string) {
    return this.galleryService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete gallery image' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.galleryService.remove(id, userId);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder gallery images' })
  async reorder(
    @Param('companyId') companyId: string,
    @Body() dto: ReorderGalleryDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.galleryService.reorder(companyId, dto, userId);
  }

  @Patch(':id/moderate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Moderate gallery image (admin only)' })
  async moderate(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @CurrentUser('sub') userId: string,
  ) {
    return this.galleryService.moderate(id, status, userId);
  }
}
