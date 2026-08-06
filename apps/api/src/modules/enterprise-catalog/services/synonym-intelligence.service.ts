import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SynonymIntelligenceService {
  private readonly logger = new Logger(SynonymIntelligenceService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async expandQuery(query: string): Promise<{ original: string; expanded: string[]; synonyms: string[] }> {
    await this.refreshCache();
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const expanded: string[] = [];
    const matchedSynonyms: string[] = [];

    for (const token of tokens) {
      const synList = this.synonymCache.get(token);
      if (synList && synList.length > 0) {
        expanded.push(...synList);
        matchedSynonyms.push(token);
      }
    }

    const allTerms = [...tokens, ...expanded];
    const unique = [...new Set(allTerms)];
    return { original: query, expanded: unique, synonyms: matchedSynonyms };
  }

  async bulkExpand(queries: string[]): Promise<Map<string, { expanded: string[]; synonyms: string[] }>> {
    await this.refreshCache();
    const results = new Map<string, { expanded: string[]; synonyms: string[] }>();
    for (const q of queries) {
      const { expanded, synonyms } = await this.expandQuery(q);
      results.set(q, { expanded, synonyms });
    }
    return results;
  }

  async getBuiltinSynonyms(): Promise<Record<string, string[]>> {
    return {
      'mobile': ['smartphone', 'cellphone', 'handset'],
      'smartphone': ['mobile', 'cellphone', 'handset'],
      'laptop': ['notebook', 'ultrabook', 'portable computer'],
      'notebook': ['laptop', 'ultrabook', 'portable computer'],
      'computer': ['pc', 'desktop', 'workstation'],
      'pc': ['computer', 'desktop', 'workstation'],
      'atta': ['wheat flour', 'chapati flour', 'whole wheat flour'],
      'wheat flour': ['atta', 'chapati flour', 'whole wheat flour'],
      'led': ['light', 'led light', 'light emitting diode'],
      'light': ['led', 'lamp', 'bulb'],
      'plastic drum': ['hdpe drum', 'plastic barrel', 'hdpe barrel'],
      'hdpe drum': ['plastic drum', 'plastic barrel', 'hdpe barrel'],
      'steel': ['stainless steel', 'mild steel', 'alloy steel'],
      'pipe': ['tube', 'piping', 'conduit'],
      'valve': ['gate valve', 'ball valve', 'butterfly valve'],
      'pump': ['centrifugal pump', 'submersible pump', 'water pump'],
      'motor': ['electric motor', 'ac motor', 'induction motor'],
      'bearing': ['ball bearing', 'roller bearing', 'bearing assembly'],
      'cable': ['wire', 'electrical cable', 'power cable'],
      'transformer': ['electrical transformer', 'power transformer', 'distribution transformer'],
      'solar': ['photovoltaic', 'solar panel', 'pv'],
      'battery': ['storage battery', 'rechargeable battery', 'accumulator'],
      'chemical': ['industrial chemical', 'raw chemical', 'processing chemical'],
      'fertilizer': ['urea', 'npk', 'dap', 'potash'],
      'pesticide': ['insecticide', 'fungicide', 'herbicide', 'agrochemical'],
      'tyre': ['tire', 'rubber tire', 'wheel tire'],
      'textile': ['fabric', 'cloth', 'yarn', 'garment'],
      'cotton': ['raw cotton', 'cotton fiber', 'cotton yarn'],
      'garment': ['apparel', 'clothing', 'readymade garment'],
      'spice': ['masala', 'condiment', 'seasoning'],
      'rice': ['paddy', 'basmati rice', 'non basmati rice'],
      'wheat': ['grain', 'cereal grain', 'food grain'],
      'oil': ['edible oil', 'vegetable oil', 'cooking oil'],
      'machine': ['machinery', 'equipment', 'industrial machine'],
      'packaging': ['packing', 'packaging material', 'wrapping'],
      'auto': ['automobile', 'vehicle', 'automotive'],
      'construction': ['building material', 'construction material', 'building supply'],
      'paint': ['coating', 'industrial paint', 'protective coating'],
      'rubber': ['natural rubber', 'synthetic rubber', 'elastomer'],
      'plastic': ['polymer', 'resin', 'plastic raw material'],
      'glass': ['borosilicate glass', 'tempered glass', 'float glass'],
      'wood': ['timber', 'plywood', 'lumber'],
      'paper': ['kraft paper', 'paper board', 'paper roll'],
      'ceramic': ['ceramic tile', 'porcelain', 'vitrified tile'],
      'furniture': ['furnishing', 'office furniture', 'home furniture'],
      'safety': ['protective equipment', 'safety gear', 'ppe'],
      'sensor': ['proximity sensor', 'temperature sensor', 'pressure sensor'],
      'switch': ['circuit breaker', 'isolator', 'electrical switch'],
      'gear': ['gear box', 'speed reducer', 'gearbox'],
      'hose': ['rubber hose', 'hydraulic hose', 'pneumatic hose'],
      'gasket': ['seal', 'o ring', 'mechanical seal'],
    };
  }

  private async refreshCache(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL_MS && this.synonymCache.size > 0) return;

    try {
      const synonyms = await this.prisma.catalogSynonym.findMany({ where: { isActive: true }, take: 1000 });
      this.synonymCache.clear();
      for (const syn of synonyms) {
        const term = syn.term.toLowerCase();
        this.synonymCache.set(term, syn.synonyms.map(s => s.toLowerCase()));
        for (const s of syn.synonyms) {
          const existing = this.synonymCache.get(s.toLowerCase());
          if (!existing) {
            this.synonymCache.set(s.toLowerCase(), [term]);
          } else if (!existing.includes(term)) {
            existing.push(term);
          }
        }
      }
      this.cacheTimestamp = now;
    } catch (err) {
      this.logger.warn(`Failed to refresh synonym cache: ${(err as Error).message}`);
    }
  }
}
