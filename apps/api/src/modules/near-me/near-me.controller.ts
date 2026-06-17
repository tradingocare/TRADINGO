import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NearMeService } from './near-me.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Near Me')
@Controller('products/near-me')
export class NearMeController {
  constructor(private readonly nearMeService: NearMeService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search products near a location with Haversine radius filter' })
  async searchProducts(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minTrustScore') minTrustScore?: string,
    @Query('verifiedOnly') verifiedOnly?: string,
    @Query('tradgoOnly') tradgoOnly?: string,
    @Query('maxMoq') maxMoq?: string,
    @Query('deliveryTime') deliveryTime?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.nearMeService.searchProducts({
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      radiusKm: parseInt(radius || '25', 10),
      categoryId,
      subcategoryId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minTrustScore: minTrustScore ? parseInt(minTrustScore, 10) : undefined,
      verifiedOnly: verifiedOnly === 'true',
      tradgoOnly: tradgoOnly === 'true',
      maxMoq: maxMoq ? parseInt(maxMoq, 10) : undefined,
      deliveryTime,
      sort: sort as any,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get product categories with counts near a location' })
  async getCategories(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.nearMeService.getCategories(
      parseFloat(lat) || 0,
      parseFloat(lng) || 0,
      parseInt(radius || '25', 10),
    );
  }

  @Get('sellers')
  @Public()
  @ApiOperation({ summary: 'Get sellers with product counts near a location' })
  async getSellers(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('minTrustScore') minTrustScore?: string,
    @Query('verifiedOnly') verifiedOnly?: string,
    @Query('tradgoOnly') tradgoOnly?: string,
  ) {
    return this.nearMeService.getSellers(
      parseFloat(lat) || 0,
      parseFloat(lng) || 0,
      parseInt(radius || '25', 10),
      {
        minTrustScore: minTrustScore ? parseInt(minTrustScore, 10) : undefined,
        verifiedOnly: verifiedOnly === 'true',
        tradgoOnly: tradgoOnly === 'true',
      },
    );
  }

  @Get('radius')
  @Public()
  @ApiOperation({ summary: 'Get available radius options and product counts per radius' })
  async getRadiusOptions(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.nearMeService.getRadiusBreakdown(
      parseFloat(lat) || 0,
      parseFloat(lng) || 0,
    );
  }
}
