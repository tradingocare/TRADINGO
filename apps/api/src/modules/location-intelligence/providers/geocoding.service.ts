import { Injectable, Logger } from '@nestjs/common';
import { GeoCacheService } from './geo-cache.service';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formatted: string;
  confidence: 'GPS' | 'VERIFIED' | 'AUTO_GEOCODED' | 'MANUAL';
  accuracy?: number;
  source: 'AUTO_GEOCODE' | 'GPS_CAPTURE' | 'ADMIN_VERIFIED';
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly nominatimBase = 'https://nominatim.openstreetmap.org';

  constructor(private readonly geoCache: GeoCacheService) {}

  async geocode(
    address: string,
    city: string,
    state: string,
    country = 'India',
    pincode?: string,
  ): Promise<GeocodingResult | null> {
    const addressKey = [address, city, state, pincode].filter(Boolean).join(', ').toLowerCase();

    const cached = this.geoCache.get(addressKey);
    if (cached) {
      return {
        ...cached,
        confidence: 'AUTO_GEOCODED',
        source: 'AUTO_GEOCODE',
        accuracy: cached.lat ? 0.8 : undefined,
      };
    }

    try {
      const query = encodeURIComponent(`${address}, ${city}, ${state}, ${country}`);
      const url = `${this.nominatimBase}/search?q=${query}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Tradingo/1.0 (marketplace intelligence)' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`Geocoding API returned ${res.status} for ${addressKey}`);
        return null;
      }
      const data = await res.json();
      if (!data?.length) {
        this.logger.warn(`No geocoding result for ${addressKey}`);
        return null;
      }

      const result: Omit<GeocodingResult, 'confidence' | 'source'> = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formatted: data[0].display_name ?? addressKey,
        accuracy: data[0].importance ? Math.round(data[0].importance * 100) / 100 : 0.5,
      };

      this.geoCache.set(addressKey, { lat: result.lat, lng: result.lng, formatted: result.formatted });
      return { ...result, confidence: 'AUTO_GEOCODED', source: 'AUTO_GEOCODE' };
    } catch (err) {
      this.logger.error(`Geocoding failed for ${addressKey}: ${(err as Error).message}`);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const cacheKey = `reverse:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = this.geoCache.get(cacheKey);
    if (cached) return cached.formatted;

    try {
      const url = `${this.nominatimBase}/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Tradingo/1.0 (marketplace intelligence)' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const displayName = data?.display_name ?? null;
      if (displayName) {
        const result = { lat, lng, formatted: displayName };
        this.geoCache.set(cacheKey, result);
      }
      return displayName;
    } catch (err) {
      this.logger.error(`Reverse geocoding failed: ${(err as Error).message}`);
      return null;
    }
  }
}
