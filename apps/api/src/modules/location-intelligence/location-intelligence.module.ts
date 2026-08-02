import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LocationIntelligenceService } from './location-intelligence.service';
import { LocationIntelligenceController } from './location-intelligence.controller';
import { GeocodingService } from './providers/geocoding.service';
import { GeoCacheService } from './providers/geo-cache.service';
import { UserPreferenceService } from './user-preference.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [LocationIntelligenceController],
  providers: [LocationIntelligenceService, GeocodingService, GeoCacheService, UserPreferenceService],
  exports: [LocationIntelligenceService, GeocodingService, GeoCacheService, UserPreferenceService],
})
export class LocationIntelligenceModule {}
