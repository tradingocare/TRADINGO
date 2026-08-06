import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeocodingService } from './providers/geocoding.service';
import { LocationSource } from '@prisma/client';

export interface GeoSearchResult {
  companyId: string;
  distance: number;
  distanceLabel: string;
}

@Injectable()
export class LocationIntelligenceService {
  private readonly logger = new Logger(LocationIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async autoGeocodeCompany(companyId: string): Promise<void> {
    const locations = await this.prisma.companyLocation.findMany({
      where: { companyId, deletedAt: null, latitude: null },
    });

    for (const loc of locations) {
      const result = await this.geocodingService.geocode(
        loc.addressLine1,
        loc.city,
        loc.state,
        loc.country,
        loc.pincode ?? undefined,
      );

      if (result) {
        await this.prisma.companyLocation.update({
          where: { id: loc.id },
          data: {
            latitude: result.lat,
            longitude: result.lng,
            locationSource: result.source,
            locationConfidence: result.confidence === 'GPS' ? 'GPS' : result.confidence === 'VERIFIED' ? 'VERIFIED' : result.confidence === 'AUTO_GEOCODED' ? 'AUTO_GEOCODED' : 'MANUAL',
            locationAccuracy: result.accuracy ?? null,
            lastGeocodedAt: new Date(),
          },
        });
      }
    }
  }

  async geocodeAllUnlocated(): Promise<{ processed: number; failed: number }> {
    const unlocated = await this.prisma.companyLocation.findMany({
      where: { deletedAt: null, latitude: null },
      select: { id: true, companyId: true, addressLine1: true, city: true, state: true, country: true, pincode: true },
    });

    let processed = 0;
    let failed = 0;

    for (const loc of unlocated) {
      const result = await this.geocodingService.geocode(
        loc.addressLine1,
        loc.city,
        loc.state,
        loc.country,
        loc.pincode ?? undefined,
      );

      if (result) {
        await this.prisma.companyLocation.update({
          where: { id: loc.id },
          data: {
            latitude: result.lat,
            longitude: result.lng,
            locationSource: result.source,
            locationConfidence: result.confidence === 'AUTO_GEOCODED' ? 'AUTO_GEOCODED' : 'MANUAL',
            locationAccuracy: result.accuracy ?? null,
            lastGeocodedAt: new Date(),
          },
        });
        processed++;
      } else {
        failed++;
      }
    }

    return { processed, failed };
  }

  async findNearbySuppliers(
    lat: number,
    lng: number,
    radiusKm = 50,
    companyIds?: string[],
  ): Promise<GeoSearchResult[]> {
    const baseWhere: Record<string, unknown> = {
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
      company: { status: 'ACTIVE', subscriptionStatus: { not: 'EXPIRED' } },
    };

    if (companyIds?.length) {
      baseWhere['companyId'] = { in: companyIds };
    }

    const locations = await this.prisma.companyLocation.findMany({
      where: baseWhere as never,
      select: { companyId: true, latitude: true, longitude: true },
    });

    return locations
      .filter((loc) => {
        if (loc.latitude == null || loc.longitude == null) return false;
        const dLat = this.toRadians(loc.latitude - lat);
        const dLng = this.toRadians(loc.longitude - lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(this.toRadians(lat)) * Math.cos(this.toRadians(loc.latitude)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c <= radiusKm;
      })
      .map((loc) => {
        const distance = this.haversine(lat, lng, loc.latitude!, loc.longitude!);
        return {
          companyId: loc.companyId,
          distance,
          distanceLabel: this.getDistanceLabel(distance),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  async getLocationSummary(): Promise<{
    totalLocations: number;
    geocoded: number;
    unlocated: number;
    gpsCapture: number;
    adminVerified: number;
    autoGeocoded: number;
  }> {
    const [totalLocations, geocoded, unlocated, gpsCapture, adminVerified, autoGeocoded] = await Promise.all([
      this.prisma.companyLocation.count({ where: { deletedAt: null } }),
      this.prisma.companyLocation.count({ where: { deletedAt: null, latitude: { not: null } } }),
      this.prisma.companyLocation.count({ where: { deletedAt: null, latitude: null } }),
      this.prisma.companyLocation.count({ where: { deletedAt: null, locationSource: 'GPS_CAPTURE' as LocationSource } }),
      this.prisma.companyLocation.count({ where: { deletedAt: null, locationSource: 'ADMIN_VERIFIED' as LocationSource } }),
      this.prisma.companyLocation.count({ where: { deletedAt: null, locationSource: 'AUTO_GEOCODE' as LocationSource } }),
    ]);

    return { totalLocations, geocoded, unlocated, gpsCapture, adminVerified, autoGeocoded };
  }

  async getGeoClusters(entityType: string, period: string): Promise<Array<{ latitude: number; longitude: number; count: number; clusterType: string }>> {
    const clusters = await this.prisma.geoCluster.findMany({
      where: { entityType, period, calculatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { latitude: true, longitude: true, count: true, clusterType: true },
      take: 500,
    });

    if (clusters.length > 0) return clusters;

    const locations = await this.prisma.companyLocation.findMany({
      where: { deletedAt: null, latitude: { not: null }, longitude: { not: null } },
      select: { latitude: true, longitude: true, companyId: true },
    });

    const grouped = new Map<string, { latSum: number; lngSum: number; count: number; ids: string[] }>();
    for (const loc of locations) {
      const key = `${Math.round((loc.latitude ?? 0) * 10) / 10},${Math.round((loc.longitude ?? 0) * 10) / 10}`;
      const existing = grouped.get(key) ?? { latSum: 0, lngSum: 0, count: 0, ids: [] };
      existing.latSum += loc.latitude ?? 0;
      existing.lngSum += loc.longitude ?? 0;
      existing.count++;
      existing.ids.push(loc.companyId);
      grouped.set(key, existing);
    }

    const heatmapData = [...grouped.entries()]
      .filter(([_, v]) => v.count >= 3)
      .map(([_, v]) => ({
        latitude: v.latSum / v.count,
        longitude: v.lngSum / v.count,
        count: v.count,
        clusterType: entityType,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 200);

    const now = new Date();
    const batch = heatmapData.map((d) => ({
      id: `${entityType}_${d.latitude.toFixed(4)}_${d.longitude.toFixed(4)}_${period}`,
      clusterType: d.clusterType,
      latitude: d.latitude,
      longitude: d.longitude,
      entityType,
      count: d.count,
      period,
      calculatedAt: now,
    }));

    for (const entry of batch) {
      await this.prisma.geoCluster.upsert({
        where: { id: entry.id },
        update: { count: entry.count, calculatedAt: now },
        create: entry,
      });
    }

    return heatmapData.slice(0, 100);
  }

  async recordBuyerHistory(params: {
    buyerId: string;
    buyerCompany?: string;
    productId?: string;
    categoryId?: string;
    sellerId?: string;
    eventType: string;
    query?: string;
    rating?: number;
    amount?: number;
  }): Promise<void> {
    await this.prisma.buyerHistory.create({
      data: {
        buyerId: params.buyerId,
        buyerCompany: params.buyerCompany,
        productId: params.productId,
        categoryId: params.categoryId,
        sellerId: params.sellerId,
        eventType: params.eventType,
        query: params.query,
        rating: params.rating,
        amount: params.amount,
      },
    });
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private getDistanceLabel(km: number): string {
    if (km <= 5) return '0-5 KM';
    if (km <= 10) return '5-10 KM';
    if (km <= 25) return '10-25 KM';
    if (km <= 50) return '25-50 KM';
    if (km <= 100) return '50-100 KM';
    return '100+ KM';
  }
}
