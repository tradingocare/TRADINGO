import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketplaceCatalogBridgeService } from './marketplace-catalog-bridge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { EnrichedCategoryTreeResponse, MappingCoverageResponse, BatchResolveResponse } from './dto/bridge-response.dto';

@ApiTags('Marketplace Catalog Bridge')
@Controller('marketplace-catalog-bridge')
export class MarketplaceCatalogBridgeController {
    constructor(private readonly service: MarketplaceCatalogBridgeService) { }

    @Get('categories/tree')
    @Public()
    @ApiOperation({ summary: 'Get enriched category tree with catalog mappings' })
    async getEnrichedTree(): Promise<EnrichedCategoryTreeResponse> {
        return this.service.getEnrichedCategoryTree();
    }

    @Get('categories/:id')
    @Public()
    @ApiOperation({ summary: 'Get enriched category by ID' })
    async getEnrichedCategory(@Param('id') id: string) {
        return this.service.getEnrichedCategory(id);
    }

    @Get('products/:id')
    @Public()
    @ApiOperation({ summary: 'Get enriched product by ID with catalog mapping' })
    async getEnrichedProduct(@Param('id') id: string) {
        return this.service.getEnrichedProduct(id);
    }

    @Get('products/search')
    @Public()
    @ApiOperation({ summary: 'Search products with catalog enrichment' })
    async searchEnrichedProducts(
        @Query('q') q?: string,
        @Query('categoryId') categoryId?: string,
        @Query('brand') brand?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.searchEnrichedProducts({
            q,
            categoryId,
            brand,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }

    @Get('coverage')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get old↔new category mapping coverage (admin)' })
    async getMappingCoverage(): Promise<MappingCoverageResponse> {
        return this.service.getMappingCoverage();
    }

    @Get('resolve/old-to-new')
    @Public()
    @ApiOperation({ summary: 'Batch resolve old category IDs to catalog categories' })
    async batchResolveOldToNew(@Query('ids') ids: string): Promise<BatchResolveResponse> {
        const idArray = ids.split(',').filter(Boolean);
        return this.service.batchResolveOldToNew(idArray);
    }

    @Get('resolve/new-to-old')
    @Public()
    @ApiOperation({ summary: 'Batch resolve catalog category IDs to old categories' })
    async batchResolveNewToOld(@Query('ids') ids: string): Promise<BatchResolveResponse> {
        const idArray = ids.split(',').filter(Boolean);
        return this.service.batchResolveNewToOld(idArray);
    }

    @Get('unified-search/bulk')
    @Public()
    @ApiOperation({ summary: 'Bulk unified search for multiple queries (comma-separated)' })
    async unifiedSearchBulk(@Query('queries') queries?: string, @Query('limit') limit?: string) {
        const qArr = queries ? queries.split(',').map((s) => s.trim()).filter(Boolean) : [];
        const limitNum = limit ? parseInt(limit) : 1;
        return this.service.unifiedSearchBulk(qArr, { includeOld: false, includeCatalog: true, limit: limitNum });
    }
}
