import { Injectable, Logger } from '@nestjs/common';

export interface GeoSearchQuery {
  lat: number;
  lon: number;
  radiusKm: number;
}

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class GeoSearchService {
  private readonly logger = new Logger(GeoSearchService.name);

  buildGeoDistanceFilter(geo: GeoSearchQuery): Record<string, unknown> {
    return {
      geo_distance: {
        distance: `${geo.radiusKm}km`,
        location: { lat: geo.lat, lon: geo.lon },
      },
    };
  }

  buildGeoDistanceSort(lat: number, lon: number): Record<string, unknown>[] {
    return [
      {
        _geo_distance: {
          location: { lat, lon },
          order: 'asc',
          unit: 'km',
          mode: 'min',
        },
      },
    ];
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  getDistanceLabel(distanceKm: number): string {
    if (distanceKm <= 5) return '0-5 KM';
    if (distanceKm <= 10) return '5-10 KM';
    if (distanceKm <= 25) return '10-25 KM';
    if (distanceKm <= 50) return '25-50 KM';
    if (distanceKm <= 100) return '50-100 KM';
    return '100+ KM';
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
