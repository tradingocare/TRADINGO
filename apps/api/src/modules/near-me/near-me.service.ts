import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const EARTH_RADIUS_KM = 6371;

export interface NearMeQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minTrustScore?: number;
  verifiedOnly?: boolean;
  tradgoOnly?: boolean;
  maxMoq?: number;
  deliveryTime?: string;
  sort?: 'distance' | 'trust' | 'price_asc' | 'price_desc' | 'trending' | 'delivery';
  page?: number;
  limit?: number;
}

export interface NearMeSeller {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean;
  isElite: boolean;
  trustScore: number;
  gstVerified: boolean;
  yearsActive?: number;
  avgResponseTime?: string;
  totalOrders?: number;
  totalProducts?: number;
  totalReviews?: number;
  rating: number;
}

export interface NearMeProduct {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number | null;
  moq: number;
  unit: string | null;
  trustScore: number;
  isVerified: boolean;
  isTradgo: boolean;
  deliveryEta: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceLabel: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  seller: NearMeSeller;
}

const RADIUS_STEPS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: 'State', value: 300 },
  { label: 'India', value: 2000 },
  { label: 'Export', value: 20000 },
];

@Injectable()
export class NearMeService {
  private readonly logger = new Logger(NearMeService.name);

  constructor(private readonly prisma: PrismaService) {}

  getRadiusOptions() {
    return RADIUS_STEPS;
  }

  getDistanceLabel(distanceKm: number): string {
    if (distanceKm <= 1) return '< 1 km';
    if (distanceKm <= 5) return '< 5 km';
    if (distanceKm <= 10) return '< 10 km';
    if (distanceKm <= 25) return '< 25 km';
    if (distanceKm <= 50) return '< 50 km';
    if (distanceKm <= 100) return '< 100 km';
    if (distanceKm <= 300) return 'Same State';
    if (distanceKm <= 2000) return 'Pan India';
    return 'Global';
  }

  async searchProducts(query: NearMeQuery) {
    const {
      lat, lng, radiusKm,
      categoryId, minPrice, maxPrice,
      minTrustScore, verifiedOnly, tradgoOnly,
      maxMoq, deliveryTime, sort = 'distance',
      page = 1, limit = 20,
    } = query;

    const offset = (page - 1) * limit;

    const conditions: Prisma.Sql[] = [Prisma.sql`pli.status = 'ACTIVE'`];

    if (categoryId) {
      conditions.push(Prisma.sql`pli."categoryId" = ${categoryId}`);
    }
    if (minPrice !== undefined) {
      conditions.push(Prisma.sql`pli.price >= ${minPrice}`);
    }
    if (maxPrice !== undefined) {
      conditions.push(Prisma.sql`pli.price <= ${maxPrice}`);
    }
    if (minTrustScore !== undefined) {
      conditions.push(Prisma.sql`pli."trustScore" >= ${minTrustScore}`);
    }
    if (verifiedOnly) {
      conditions.push(Prisma.sql`pli."isVerified" = true`);
    }
    if (tradgoOnly) {
      conditions.push(Prisma.sql`pli."isTradgo" = true`);
    }
    if (maxMoq !== undefined) {
      conditions.push(Prisma.sql`pli.moq <= ${maxMoq}`);
    }
    if (deliveryTime) {
      conditions.push(Prisma.sql`pli."deliveryEta" IS NOT NULL AND pli."deliveryEta" <= ${deliveryTime}`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    const SORT_CLAUSES: Record<string, Prisma.Sql> = {
      distance: Prisma.sql`distance ASC`,
      trust: Prisma.sql`pli."trustScore" DESC, distance ASC`,
      price_asc: Prisma.sql`pli.price ASC NULLS LAST, distance ASC`,
      price_desc: Prisma.sql`pli.price DESC NULLS LAST, distance ASC`,
      trending: Prisma.sql`pli."trustScore" DESC, pli."isVerified" DESC, distance ASC`,
      delivery: Prisma.sql`pli."deliveryEta" ASC NULLS LAST, distance ASC`,
    };
    const orderClause = SORT_CLAUSES[sort] || SORT_CLAUSES.distance;

    const havDistance = Prisma.sql`${EARTH_RADIUS_KM} * acos(
      cos(radians(${lat})) * cos(radians(pli.latitude)) *
      cos(radians(pli.longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(pli.latitude))
    )`;

    try {
      const [products, countResult] = await Promise.all([
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          WITH filtered AS (
            SELECT
              pli.id, pli."productId", pli."companyId", pli."categoryId",
              pli.latitude, pli.longitude, pli."trustScore",
              pli.price, pli.moq, pli."isVerified", pli."isTradgo", pli."deliveryEta",
              ${havDistance} AS distance
            FROM "ProductLocationIndex" pli
            WHERE ${whereClause}
              AND ${havDistance} <= ${radiusKm}
          )
          SELECT
            f.id, f."productId", f."companyId", f."categoryId",
            f.latitude, f.longitude, f."trustScore",
            f.price, f.moq, f."isVerified", f."isTradgo", f."deliveryEta",
            ROUND(f.distance::numeric, 2)::float8 AS "distanceKm",
            p.name, p.slug, p."shortDescription", p.unit,
            c.name AS "companyName", c.slug AS "companySlug",
            c.logo AS "companyLogo",
            c."trustScore" AS "companyTrustScore",
            c."verificationLevel" AS "companyVerificationLevel",
            c."isTradgoElite" AS "companyIsTradgoElite",
            c."gstNumber" AS "companyGstNumber",
            c."responseRate" AS "companyResponseRate",
            c."establishedYear" AS "companyEstablishedYear",
            c."totalProducts" AS "companyTotalProducts",
            cat.name AS "categoryName",
            (SELECT pm.url FROM "ProductMedia" pm WHERE pm."productId" = f."productId" ORDER BY pm."sortOrder" ASC LIMIT 1) AS "imageUrl",
            (SELECT loc.city FROM "CompanyLocation" loc WHERE loc."companyId" = c.id AND loc."isPrimary" = true LIMIT 1) AS "sellerCity",
            (SELECT loc.state FROM "CompanyLocation" loc WHERE loc."companyId" = c.id AND loc."isPrimary" = true LIMIT 1) AS "sellerState"
          FROM filtered f
          JOIN "Product" p ON p.id = f."productId"
          JOIN "Company" c ON c.id = f."companyId"
          LEFT JOIN "Category" cat ON cat.id = f."categoryId"
          ORDER BY ${orderClause}
          LIMIT ${limit} OFFSET ${offset}
        `),
        this.prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
          SELECT COUNT(*) as total
          FROM "ProductLocationIndex" pli
          WHERE ${whereClause}
            AND ${havDistance} <= ${radiusKm}
        `),
      ]);

      const total = Number(countResult[0]?.total || 0);
      const data = (products || []).map((p: any) => ({
        ...p,
        distanceLabel: this.getDistanceLabel(Number(p.distanceKm)),
        price: p.price ? Number(p.price) : null,
        seller: {
          id: p.companyId,
          name: p.companyName || 'Verified Supplier',
          slug: p.companySlug,
          logo: p.companyLogo || undefined,
          city: p.sellerCity || undefined,
          state: p.sellerState || undefined,
          country: undefined,
          isVerified: p.companyVerificationLevel !== 'LEVEL_0' && p.companyVerificationLevel != null,
          isElite: !!p.companyIsTradgoElite,
          trustScore: p.companyTrustScore || 0,
          gstVerified: !!p.companyGstNumber,
          yearsActive: p.companyEstablishedYear ? new Date().getFullYear() - p.companyEstablishedYear : undefined,
          avgResponseTime: p.companyResponseRate ? `< ${p.companyResponseRate}` : undefined,
          totalOrders: p.monthlyOrders || undefined,
          totalProducts: p.companyTotalProducts || undefined,
          totalReviews: undefined,
          rating: 0,
        },
      }));

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          center: { lat, lng },
          radiusKm,
        },
      };
    } catch (error) {
      this.logger.error('NearMe search failed', error);
      return { data: [], meta: { total: 0, page, limit, totalPages: 0, center: { lat, lng }, radiusKm } };
    }
  }

  async getCategories(lat: number, lng: number, radiusKm: number) {
    const result = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        cat.id, cat.name, cat.slug, cat.icon,
        COUNT(pli.id) AS "productCount"
      FROM "ProductLocationIndex" pli
      JOIN "Category" cat ON cat.id = pli."categoryId"
      WHERE pli.status = 'ACTIVE'
        AND ${EARTH_RADIUS_KM} * acos(
          cos(radians(${lat})) * cos(radians(pli.latitude)) *
          cos(radians(pli.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(pli.latitude))
        ) <= ${radiusKm}
      GROUP BY cat.id, cat.name, cat.slug, cat.icon
      ORDER BY "productCount" DESC
      LIMIT 50
    `);
    return result || [];
  }

  async getSellers(lat: number, lng: number, radiusKm: number, filters?: { minTrustScore?: number; verifiedOnly?: boolean; tradgoOnly?: boolean }) {
    const conditions: Prisma.Sql[] = [Prisma.sql`pli.status = 'ACTIVE'`];

    if (filters?.minTrustScore) {
      conditions.push(Prisma.sql`pli."trustScore" >= ${filters.minTrustScore}`);
    }
    if (filters?.verifiedOnly) {
      conditions.push(Prisma.sql`pli."isVerified" = true`);
    }
    if (filters?.tradgoOnly) {
      conditions.push(Prisma.sql`pli."isTradgo" = true`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    const result = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        c.id, c.name, c.slug, c."trustScore", c."verificationLevel",
        c."isTradgo", c."geographicReach",
        AVG(pli."trustScore")::int AS "avgTrustScore",
        COUNT(pli.id) AS "productCount",
        ROUND(AVG(${EARTH_RADIUS_KM} * acos(
          cos(radians(${lat})) * cos(radians(pli.latitude)) *
          cos(radians(pli.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(pli.latitude))
        ))::numeric, 2)::float8 AS "avgDistanceKm"
      FROM "ProductLocationIndex" pli
      JOIN "Company" c ON c.id = pli."companyId"
      WHERE ${whereClause}
        AND ${EARTH_RADIUS_KM} * acos(
          cos(radians(${lat})) * cos(radians(pli.latitude)) *
          cos(radians(pli.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(pli.latitude))
        ) <= ${radiusKm}
      GROUP BY c.id, c.name, c.slug, c."trustScore", c."verificationLevel", c."isTradgo", c."geographicReach"
      ORDER BY "avgTrustScore" DESC, "productCount" DESC
      LIMIT 50
    `);
    return (result || []).map((s: any) => ({
      ...s,
      avgDistanceKm: Number(s.avgDistanceKm),
      distanceLabel: this.getDistanceLabel(Number(s.avgDistanceKm)),
    }));
  }

  async getRadiusBreakdown(lat: number, lng: number) {
    const breakdown: { radius: number; label: string; count: number }[] = [];

    for (const step of RADIUS_STEPS) {
      const result = await this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM "ProductLocationIndex" pli
        WHERE pli.status = 'ACTIVE'
          AND ${EARTH_RADIUS_KM} * acos(
            cos(radians(${lat})) * cos(radians(pli.latitude)) *
            cos(radians(pli.longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(pli.latitude))
          ) <= ${step.value}
      `);
      breakdown.push({
        radius: step.value,
        label: step.label,
        count: result[0]?.count || 0,
      });
    }

    return breakdown;
  }
}
