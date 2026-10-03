import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { SynonymIntelligenceService } from '../enterprise-catalog/services/synonym-intelligence.service';
import { CatalogClassifyService } from './catalog-classify.service';

// Phase 11: the unified classification endpoint fronts existing fragments
// without duplicating logic. Tiers: exact (deterministic) → synonym engine
// → single gateway LLM call → honest fallback. No fake classifications.

describe('CatalogClassifyService (POST /catalog/classify)', () => {
  let service: CatalogClassifyService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let gateway: { process: jest.Mock };
  let synonyms: { expandQuery: jest.Mock };
  let adapter: { unifiedSearch: jest.Mock };

  const itemRow = {
    id: 'ci-1',
    name: 'CNC Lathe Machine X1',
    type: 'Product',
    subcategory: {
      id: 'cs-1',
      name: 'CNC Lathe',
      category: { id: 'cc-1', name: 'CNC Machines' },
    },
  };

  beforeEach(async () => {
    prisma = {
      catalogItem: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
      catalogCategory: { findFirst: jest.fn() },
      catalogSubcategory: { findFirst: jest.fn() },
    };
    gateway = { process: jest.fn() };
    synonyms = { expandQuery: jest.fn().mockResolvedValue({ original: '', expanded: [] }) };
    adapter = {
      unifiedSearch: jest.fn().mockResolvedValue([]),
      getCatalogTree: jest.fn().mockResolvedValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogClassifyService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        { provide: CatalogAdapterService, useValue: adapter },
        { provide: AiGatewayService, useValue: gateway },
        { provide: SynonymIntelligenceService, useValue: synonyms },
      ],
    }).compile();

    service = module.get<CatalogClassifyService>(CatalogClassifyService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('exact tier: deterministic HIGH with canonical IDs, no gateway call', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(itemRow);

    const result = await service.classify({ name: 'CNC Lathe Machine X1' }, 'company-1');

    expect(result).toMatchObject({
      categoryId: 'cc-1',
      subcategoryId: 'cs-1',
      catalogItemId: 'ci-1',
      type: 'Product',
      confidence: 1.0,
      band: 'HIGH',
      matchType: 'exact',
      categoryName: 'CNC Machines',
      subcategoryName: 'CNC Lathe',
    });
    expect(gateway.process).not.toHaveBeenCalled();
  });

  it('synonym tier: single unambiguous candidate resolves to IDs', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    synonyms.expandQuery.mockResolvedValue({ original: 'lathe', expanded: ['lathe', 'turning machine'] });
    prisma.catalogItem.findMany.mockResolvedValue([itemRow]);

    const result = await service.classify({ name: 'turning machine' }, 'company-1');

    expect(result.matchType).toBe('synonym');
    expect(result.catalogItemId).toBe('ci-1');
    expect(result.band).toBe('MEDIUM');
    expect(gateway.process).not.toHaveBeenCalled();
  });

  it('AI tier: resolves suggestion names to canonical IDs server-side', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    prisma.catalogItem.findMany.mockResolvedValue([]);
    gateway.process.mockResolvedValue({
      content: JSON.stringify({
        suggestedCategory: 'CNC Machines',
        suggestedSubcategory: 'CNC Lathe',
        confidence: 'high',
        reasoning: 'matches turning equipment',
        alternatives: [{ name: 'Lathe Accessories', reasoning: 'adjacent' }],
      }),
    });
    prisma.catalogCategory.findFirst.mockResolvedValue({ id: 'cc-1', name: 'CNC Machines' });
    prisma.catalogSubcategory.findFirst.mockResolvedValue({ id: 'cs-1', name: 'CNC Lathe' });

    const result = await service.classify({ name: 'Mystery turning gadget' }, 'company-1', 'user-1');

    expect(gateway.process).toHaveBeenCalledTimes(1);
    const [dto] = gateway.process.mock.calls[0];
    expect(dto.taskType).toBe('CATEGORY_SUGGESTION');
    expect(result).toMatchObject({
      categoryId: 'cc-1',
      subcategoryId: 'cs-1',
      matchType: 'ai',
      band: 'MEDIUM',
    });
  });

  it('AI suggestion that resolves to nothing degrades honestly to LOW picker', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    prisma.catalogItem.findMany.mockResolvedValue([]);
    gateway.process.mockResolvedValue({
      content: JSON.stringify({ suggestedCategory: 'No Such Category', confidence: 'high', reasoning: 'x' }),
    });
    prisma.catalogCategory.findFirst.mockResolvedValue(null);

    const result = await service.classify({ name: 'zzz unknown thing' }, 'company-1');

    expect(result.band).toBe('LOW');
    expect(result.catalogItemId).toBeNull();
  });

  it('gateway failure falls through to fallback, never throws classification away', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    prisma.catalogItem.findMany.mockResolvedValue([]);
    gateway.process.mockRejectedValue(new Error('provider down'));
    adapter.unifiedSearch.mockResolvedValue([
      { id: 'ci-9', name: 'Lathe Chuck', type: 'catalogItem', parentName: 'CNC Machines / Accessories' },
    ]);
    prisma.catalogItem.findUnique.mockResolvedValue({
      id: 'ci-9',
      name: 'Lathe Chuck',
      type: 'Product',
      subcategory: { id: 'cs-9', category: { id: 'cc-9' } },
    });

    const result = await service.classify({ name: 'chuck' }, 'company-1');

    expect(result.band).toBe('LOW');
    expect(result.matchType).toBe('fallback');
    expect(result.alternatives).toHaveLength(1);
    expect(result.alternatives[0]).toMatchObject({ catalogItemId: 'ci-9' });
  });

  it('total miss returns honest unclassified with empty alternatives', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    prisma.catalogItem.findMany.mockResolvedValue([]);
    gateway.process.mockResolvedValue({ content: '{}' });
    adapter.unifiedSearch.mockResolvedValue([]);

    const result = await service.classify({ name: 'qqqzzz' }, 'company-1');

    expect(result).toMatchObject({
      categoryId: null,
      catalogItemId: null,
      band: 'LOW',
      matchType: 'unclassified',
      alternatives: [],
    });
  });

  it('malformed LLM JSON degrades to fallback instead of throwing', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    prisma.catalogItem.findMany.mockResolvedValue([]);
    gateway.process.mockResolvedValue({ content: 'not json at all{{{' });
    adapter.unifiedSearch.mockResolvedValue([]);

    const result = await service.classify({ name: 'gadget' }, 'company-1');

    expect(result.band).toBe('LOW');
  });

  it('context hint narrows the leaf type', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(itemRow);

    const result = await service.classify({ name: 'CNC Lathe Machine X1', context: 'service' }, 'company-1');

    // Exact tier searched with type=Service filter; mock returns the row
    // regardless — assert the filter was passed, not the mock's shape.
    expect(prisma.catalogItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: 'Service' }) }),
    );
    expect(result.type).toBe('Product');
  });

  it('aiTier:false skips the gateway (deterministic tiers only, free)', async () => {
    prisma.catalogItem.findFirst.mockResolvedValue(null);
    prisma.catalogItem.findMany.mockResolvedValue([]);
    adapter.unifiedSearch.mockResolvedValue([]);

    const result = await service.classify({ name: 'mystery gadget' }, 'company-1', undefined, { aiTier: false });

    expect(gateway.process).not.toHaveBeenCalled();
    expect(result.band).toBe('LOW');
  });

  it('resolveCategoryText: exact match wins without gateway', async () => {
    prisma.catalogCategory.findFirst.mockResolvedValue({ id: 'cc-9', name: 'Pumps & Pipes' });

    const result = await service.resolveCategoryText('Pumps & Pipes');

    expect(result).toEqual({ categoryId: 'cc-9', categoryName: 'Pumps & Pipes', matchType: 'exact' });
    expect(gateway.process).not.toHaveBeenCalled();
  });

  it('resolveCategoryText: blank input resolves to null (no error)', async () => {
    await expect(service.resolveCategoryText('')).resolves.toBeNull();
    await expect(service.resolveCategoryText('   ')).resolves.toBeNull();
    expect(prisma.catalogCategory.findFirst).not.toHaveBeenCalled();
  });

  it('resolveCategoryText: unresolvable text returns null (caller must report)', async () => {
    prisma.catalogCategory.findFirst.mockResolvedValue(null);
    synonyms.expandQuery.mockResolvedValue({ original: 'zzz', expanded: ['zzz'] });

    await expect(service.resolveCategoryText('Zzz Not Real')).resolves.toBeNull();
  });
});
