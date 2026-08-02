import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface FreightEstimate {
  distanceKm: number;
  estimatedCost: number;
  currency: string;
  estimatedDays: number;
  confidence: number;
  carrierOptions: Array<{
    carrierId: string;
    carrierName: string;
    cost: number;
    estimatedDays: number;
    serviceType: string;
  }>;
}

export interface FreightAnalytics {
  totalShipments: number;
  avgCost: number;
  avgDeliveryDays: number;
  onTimeRate: number;
  byCarrier: Array<{ carrier: string; count: number; avgCost: number }>;
  byRegion: Array<{ region: string; count: number; avgDays: number }>;
}

const RATE_PER_KM = 0.5;

@Injectable()
export class FreightIntelligenceService {
  private readonly logger = new Logger(FreightIntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async estimateFreight(params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    weight?: number;
    weightUnit?: string;
    shipmentType?: string;
    packages?: number;
  }): Promise<FreightEstimate> {
    const distanceKm = this.haversine(params.originLat, params.originLng, params.destLat, params.destLng);
    const weight = params.weight ?? 1;
    const pkgCount = params.packages ?? 1;

    const baseCost = distanceKm * RATE_PER_KM * weight * pkgCount;
    const estimatedCost = Math.round(baseCost * 100) / 100;

    const carriers = await this.prisma.courierProvider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, metadata: true },
    });

    const carrierOptions = carriers.map((c) => {
      const multiplier = c.name === 'Delhivery' ? 0.9 : c.name === 'Bluedart' ? 1.2 : c.name === 'DTDC' ? 0.8 : 1.0;
      return {
        carrierId: c.id,
        carrierName: c.name,
        cost: Math.round(baseCost * multiplier * 100) / 100,
        estimatedDays: Math.max(1, Math.round(distanceKm / 300) + (multiplier > 1 ? 0 : 1)),
        serviceType: params.shipmentType ?? 'STANDARD',
      };
    });

    const avgDays = Math.round(distanceKm / 400 + 1);
    const confidence = distanceKm < 100 ? 95 : distanceKm < 500 ? 85 : 75;

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      estimatedCost,
      currency: 'INR',
      estimatedDays: avgDays,
      confidence,
      carrierOptions: carrierOptions.sort((a, b) => a.cost - b.cost),
    };
  }

  async getCarrierAnalytics(params: { period?: string; limit?: number }): Promise<FreightAnalytics> {
    const days = params.period === 'monthly' ? 30 : params.period === 'quarterly' ? 90 : 7;
    const since = new Date(Date.now() - days * 86400000);

    const shipments = await this.prisma.shipment.findMany({
      where: { createdAt: { gte: since } },
      include: { courierProvider: { select: { name: true } } },
    });

    const totalShipments = shipments.length;
    const delivered = shipments.filter((s) => s.status === 'DELIVERED');
    const avgCost = shipments.reduce((s, sh) => {
      const details = sh.courierDetails as any;
      return s + (details?.cost ?? 0);
    }, 0) / (totalShipments || 1);

    const onTimeDeliveries = delivered.filter((s) => {
      if (!s.estimatedDeliveryDate || !s.deliveredAt) return false;
      return new Date(s.deliveredAt) <= new Date(s.estimatedDeliveryDate);
    });
    const onTimeRate = delivered.length > 0 ? Math.round((onTimeDeliveries.length / delivered.length) * 100) : 0;

    const byCarrierMap = new Map<string, { count: number; totalCost: number }>();
    const byRegionMap = new Map<string, { count: number; totalDays: number }>();

    for (const s of shipments) {
      const carrierName = s.courierProvider?.name ?? 'Unknown';
      const existing = byCarrierMap.get(carrierName) ?? { count: 0, totalCost: 0 };
      existing.count++;
      byCarrierMap.set(carrierName, existing);

      const region = (s.deliveryAddress as any)?.state ?? 'Unknown';
      const regionExisting = byRegionMap.get(region) ?? { count: 0, totalDays: 0 };
      regionExisting.count++;
      if (s.estimatedDeliveryDate && s.dispatchDate) {
        regionExisting.totalDays += Math.round(
          (new Date(s.estimatedDeliveryDate).getTime() - new Date(s.dispatchDate).getTime()) / 86400000,
        );
      }
      byRegionMap.set(region, regionExisting);
    }

    const avgDeliveryDays = delivered.length > 0
      ? Math.round(
          delivered.reduce((s, sh) => {
            if (!sh.dispatchDate || !sh.deliveredAt) return s;
            return s + Math.round((new Date(sh.deliveredAt).getTime() - new Date(sh.dispatchDate).getTime()) / 86400000);
          }, 0) / delivered.length,
        )
      : 0;

    return {
      totalShipments,
      avgCost: Math.round(avgCost * 100) / 100,
      avgDeliveryDays,
      onTimeRate,
      byCarrier: [...byCarrierMap.entries()].map(([carrier, d]) => ({
        carrier,
        count: d.count,
        avgCost: Math.round((d.totalCost / d.count) * 100) / 100,
      })),
      byRegion: [...byRegionMap.entries()].map(([region, d]) => ({
        region,
        count: d.count,
        avgDays: Math.round(d.totalDays / d.count),
      })),
    };
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
}
