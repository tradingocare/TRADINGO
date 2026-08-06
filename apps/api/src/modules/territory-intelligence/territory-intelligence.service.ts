import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TerritoryNode {
  id: string;
  name: string;
  type: string;
  states?: string | null;
  cities?: string | null;
  rmId?: string | null;
  coverage: string;
  isActive: boolean;
  children?: TerritoryNode[];
}

@Injectable()
export class TerritoryIntelligenceService {
  private readonly logger = new Logger(TerritoryIntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTree(): Promise<TerritoryNode[]> {
    const territories = await this.prisma.territory.findMany({ where: { isActive: true } });
    const map = new Map<string, TerritoryNode>();
    const roots: TerritoryNode[] = [];

    for (const t of territories) {
      map.set(t.id, {
        id: t.id,
        name: t.name,
        type: t.type,
        states: t.states,
        cities: t.cities,
        rmId: t.rmId,
        coverage: t.coverage,
        isActive: t.isActive,
        children: [],
      });
    }

    for (const t of territories) {
      const node = map.get(t.id);
      if (t.parentId && map.has(t.parentId)) {
        map.get(t.parentId)!.children!.push(node!);
      } else if (!t.parentId) {
        roots.push(node!);
      }
    }

    return roots;
  }

  async create(data: { name: string; type: string; parentId?: string; states?: string; cities?: string; rmId?: string; coverage?: string }) {
    return this.prisma.territory.create({ data: data as any });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.prisma.territory.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException('Territory not found'); });
    return this.prisma.territory.update({ where: { id }, data: data as any });
  }

  async getCoverageAnalytics() {
    const territories = await this.prisma.territory.findMany({
      where: { isActive: true },
      include: { children: true },
    });

    const companyLocations = await this.prisma.companyLocation.findMany({
      where: { deletedAt: null },
      select: { city: true, state: true, companyId: true },
    });

    const stateCoverage = new Map<string, { assigned: number; total: number; companies: number }>();

    for (const loc of companyLocations) {
      const state = loc.state || 'Unknown';
      const existing = stateCoverage.get(state) ?? { assigned: 0, total: 0, companies: 0 };
      existing.total++;
      existing.companies = new Set([...Array.from(existing.companies ? [existing.companies] : []), loc.companyId]).size;
      stateCoverage.set(state, existing);
    }

    for (const t of territories) {
      if (!t.states) continue;
      for (const state of t.states.split(',').map((s) => s.trim())) {
        const existing = stateCoverage.get(state);
        if (existing) {
          existing.assigned++;
          stateCoverage.set(state, existing);
        }
      }
    }

    return {
      totalTerritories: territories.length,
      coveredStates: stateCoverage.size,
      coverage: [...stateCoverage.entries()].map(([state, d]) => ({
        state,
        assignedToTerritory: d.assigned > 0,
        totalLocations: d.total,
      })),
      territoryBreakdown: territories.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        childrenCount: t.children.length,
        rmId: t.rmId,
      })),
    };
  }

  async getRmTerritories(rmId: string) {
    return this.prisma.territory.findMany({
      where: { rmId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCompanyTerritory(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { locations: { where: { deletedAt: null }, select: { state: true, city: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');

    const states = [...new Set(company.locations.map((l) => l.state).filter(Boolean))];
    const cities = [...new Set(company.locations.map((l) => l.city).filter(Boolean))];

    const territory = await this.prisma.territory.findFirst({
      where: {
        isActive: true,
        OR: [
          { states: { in: states } },
          { cities: { in: cities } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return territory;
  }
}
