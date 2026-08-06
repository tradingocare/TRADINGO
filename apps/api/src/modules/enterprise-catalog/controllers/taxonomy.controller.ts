import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { TaxonomyService } from '../services/taxonomy.service';
import { CreateCatalogSynonymDto, UpdateCatalogSynonymDto, CreateIndustryCategoryMappingDto } from '../dto/taxonomy.dto';

@ApiTags('Taxonomy')
@Controller('enterprise-catalog/taxonomy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Post('synonyms')
  @ApiOperation({ summary: 'Create a catalog synonym' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  createSynonym(@Body() dto: CreateCatalogSynonymDto) {
    return this.taxonomyService.createSynonym(dto);
  }

  @Get('synonyms')
  @ApiOperation({ summary: 'List all catalog synonyms' })
  @Public()
  findAllSynonyms(@Query('search') search?: string, @Query('locale') locale?: string) {
    return this.taxonomyService.findAllSynonyms(search, locale);
  }

  @Get('synonyms/:id')
  @ApiOperation({ summary: 'Get synonym by ID' })
  @Public()
  findSynonymById(@Param('id') id: string) {
    return this.taxonomyService.findSynonymById(id);
  }

  @Patch('synonyms/:id')
  @ApiOperation({ summary: 'Update a catalog synonym' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  updateSynonym(@Param('id') id: string, @Body() dto: UpdateCatalogSynonymDto) {
    return this.taxonomyService.updateSynonym(id, dto);
  }

  @Delete('synonyms/:id')
  @ApiOperation({ summary: 'Delete a catalog synonym' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN')
  removeSynonym(@Param('id') id: string) {
    return this.taxonomyService.removeSynonym(id);
  }

  @Post('industry-category-mappings')
  @ApiOperation({ summary: 'Create industry-category mapping' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  createMapping(@Body() dto: CreateIndustryCategoryMappingDto) {
    return this.taxonomyService.createIndustryCategoryMapping(dto);
  }

  @Get('industry-category-mappings')
  @ApiOperation({ summary: 'List industry-category mappings' })
  @Public()
  findAllMappings(@Query('industryId') industryId?: string, @Query('categoryId') categoryId?: string) {
    return this.taxonomyService.findAllIndustryCategoryMappings(industryId, categoryId);
  }

  @Delete('industry-category-mappings/:id')
  @ApiOperation({ summary: 'Delete industry-category mapping' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN')
  removeMapping(@Param('id') id: string) {
    return this.taxonomyService.removeIndustryCategoryMapping(id);
  }
}
