import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus, CompanyStatus, RfqStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [productCount, companyCount, rfqCount, orderCount, locationCount] = await Promise.all([
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.company.count({ where: { status: CompanyStatus.ACTIVE } }),
      this.prisma.rfq.count({ where: { status: { in: [RfqStatus.ACTIVE, RfqStatus.CLOSED, RfqStatus.ACCEPTED, RfqStatus.CONVERTED] } } }),
      this.prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
      this.prisma.companyLocation.findMany({
        where: { isPrimary: true },
        select: { city: true },
        distinct: ['city'],
      }),
    ]);
    const cities = new Set(locationCount.map((l) => l.city));
    return {
      productsListed: productCount,
      activeTraders: companyCount,
      liveRfqs: rfqCount,
      ordersCompleted: orderCount,
      citiesCovered: cities.size,
    };
  }

  async getCityStats() {
    const locations = await this.prisma.companyLocation.findMany({
      where: { isPrimary: true },
      select: { city: true, state: true, companyId: true },
    });
    const cityMap = new Map<string, { state: string; companies: Set<string> }>();
    for (const loc of locations) {
      const key = loc.city;
      if (!cityMap.has(key)) cityMap.set(key, { state: loc.state ?? '', companies: new Set() });
      cityMap.get(key)!.companies.add(loc.companyId);
    }
    return Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      state: data.state,
      companyCount: data.companies.size,
    })).sort((a, b) => b.companyCount - a.companyCount);
  }

  async getStateStats() {
    const locations = await this.prisma.companyLocation.findMany({
      where: { isPrimary: true },
      select: { state: true, companyId: true, city: true },
    });
    const stateMap = new Map<string, { companies: Set<string>; cities: Set<string> }>();
    for (const loc of locations) {
      if (!loc.state) continue;
      if (!stateMap.has(loc.state)) stateMap.set(loc.state, { companies: new Set(), cities: new Set() });
      stateMap.get(loc.state)!.companies.add(loc.companyId);
      stateMap.get(loc.state)!.cities.add(loc.city);
    }
    return Array.from(stateMap.entries()).map(([state, data]) => ({
      state,
      companyCount: data.companies.size,
      cityCount: data.cities.size,
    })).sort((a, b) => b.companyCount - a.companyCount);
  }
}
