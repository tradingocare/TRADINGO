import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LocationIntelligenceService } from './location-intelligence.service';
import { GeocodingService } from './providers/geocoding.service';
import { GeoCacheService } from './providers/geo-cache.service';

@ApiTags('Location Intelligence')
@UseGuards(JwtAuthGuard)
@Controller('location-intelligence')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class LocationIntelligenceController {
  constructor(
    private readonly locationIntelligence: LocationIntelligenceService,
    private readonly geocodingService: GeocodingService,
    private readonly geoCache: GeoCacheService,
  ) {}

  @Post('geocode/:companyId')
  @ApiOperation({ summary: 'Trigger geocoding for a company' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async triggerGeocode(@Param('companyId') companyId: string) {
    await this.locationIntelligence.autoGeocodeCompany(companyId);
    return { message: 'Geocoding triggered', companyId };
  }

  @Post('geocode-all')
  @ApiOperation({ summary: 'Geocode all unlocated companies' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async geocodeAll() {
    return this.locationIntelligence.geocodeAllUnlocated();
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby suppliers' })
  async getNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
  ) {
    return this.locationIntelligence.findNearbySuppliers(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius, 10) : 50,
    );
  }

  @Public()
  @Get('clusters')
  @ApiOperation({ summary: 'Get geo clusters' })
  async getClusters(
    @Query('entityType') entityType = 'supplier',
    @Query('period') period = 'daily',
  ) {
    return this.locationIntelligence.getGeoClusters(entityType, period);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get location intelligence summary' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSummary() {
    return this.locationIntelligence.getLocationSummary();
  }

  @Get('cache-stats')
  @ApiOperation({ summary: 'Get geo cache statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCacheStats() {
    return this.geoCache.getStats();
  }

  @Post('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates' })
  async reverseGeocode(@Body() body: { lat: number; lng: number }) {
    return { address: await this.geocodingService.reverseGeocode(body.lat, body.lng) };
  }
}
