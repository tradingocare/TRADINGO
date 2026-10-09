import { Body, Controller, Get, Post, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoryMappingService } from './category-mapping.service';
import { BatchResolveMappingsDto } from './dto/category-mapping.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Category Mapping')
@Controller('category-mapping')
export class CategoryMappingController {
  constructor(private readonly service: CategoryMappingService) {}

  @Get('resolve')
  @Public()
  @ApiOperation({ summary: 'Resolve a legacy category slug to approved catalog categories (read-only)' })
  async resolveBySlug(@Query('legacySlug') legacySlug?: string) {
    if (!legacySlug || !legacySlug.trim()) {
      throw new BadRequestException('legacySlug query parameter is required');
    }
    return this.service.resolveByLegacySlug(legacySlug.trim());
  }

  @Post('resolve/batch')
  @Public()
  @ApiOperation({ summary: 'Batch resolve legacy category IDs to approved catalog categories (read-only)' })
  async resolveBatch(@Body() dto: BatchResolveMappingsDto) {
    return this.service.resolveBatch(dto?.ids ?? []);
  }

  @Get('resolve/reverse')
  @Public()
  @ApiOperation({ summary: 'Resolve a catalog category slug to mapped legacy categories (read-only)' })
  async resolveReverse(@Query('catalogSlug') catalogSlug?: string) {
    if (!catalogSlug || !catalogSlug.trim()) {
      throw new BadRequestException('catalogSlug query parameter is required');
    }
    return this.service.resolveReverse(catalogSlug.trim());
  }
}
