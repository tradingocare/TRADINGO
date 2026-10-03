import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogClassifyService } from './catalog-classify.service';
import { CatalogTaxonomyPersistenceService } from './catalog-taxonomy-persistence.service';

// P0-2: the shared writer-side contract. Guarantees tested:
//  - only VALID canonical triples persist (item chain verified from the DB,
//    never fabricated from client input);
//  - confirmed-but-invalid IDs fall back to the deterministic classifier
//    (never persisted as-is);
//  - deterministic resolution returns a triple only for exact-band results;
//  - the legacy bridge maps canonical → legacy Category by slug equality.

describe('CatalogTaxonomyPersistenceService (P0-2)', () => {
  let service: CatalogTaxonomyPersistenceService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let classify: { classify: jest.Mock; resolveCategoryText?: jest.Mock };

  const itemChain = {
    id: 'ci-1',
    type: 'Product',
    subcategory: { id: 'cs-1', category: { id: 'cc-1' } },
  };

  beforeEach(async () => {
    prisma = {
      catalogItem: { findFirst: jest.fn(), findUnique: jest.fn() },
      catalogSubcategory: { findFirst: jest.fn() },
      catalogCategory: { findFirst: jest.fn(), findUnique: jest.fn() },
      category: { findUnique: jest.fn() },
    };
    classify = {
      classify: jest.fn(),
      resolveCategoryText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogTaxonomyPersistenceService,
        { provide: PrismaService, useValue: prisma },
        { provide: CatalogClassifyService, useValue: classify },
      ],
    }).compile();
    service = module.get(CatalogTaxonomyPersistenceService);
    Logger.overrideLogger({ log: () => {}, warn: () => {}, error: () => {} } as any);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('validateConfirmedTriple', () => {
    it('item-first: verifies the whole chain from the DB and returns the canonical triple', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue(itemChain);

      const result = await service.validateConfirmedTriple({
        categoryId: 'ignored-client-value',
        subcategoryId: 'ignored-client-value',
        catalogItemId: 'ci-1',
        expectedType: 'Product',
      });

      // Client-supplied category/subcategory are NEVER trusted — the item
      // chain is the single source of truth.
      expect(result).toEqual({ categoryId: 'cc-1', subcategoryId: 'cs-1', catalogItemId: 'ci-1' });
      expect(prisma.catalogItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'ci-1', isActive: true, type: 'Product' }) }),
      );
    });

    it('invalid catalogItemId → null (never fabricated)', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue(null);

      const result = await service.validateConfirmedTriple({ catalogItemId: 'ci-bogus' });

      expect(result).toBeNull();
    });

    it('type mismatch (Product expected, Service found) → null', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue(null); // type filter excludes it

      const result = await service.validateConfirmedTriple({
        catalogItemId: 'ci-1',
        expectedType: 'Product',
      });

      expect(result).toBeNull();
    });

    it('subcategory-only confirmation: verifies parent linkage', async () => {
      prisma.catalogSubcategory.findFirst.mockResolvedValue({ id: 'cs-1', categoryId: 'cc-1' });

      const result = await service.validateConfirmedTriple({
        categoryId: 'cc-1',
        subcategoryId: 'cs-1',
      });

      expect(result).toEqual({ categoryId: 'cc-1', subcategoryId: 'cs-1', catalogItemId: null });
      expect(prisma.catalogSubcategory.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'cs-1', categoryId: 'cc-1' }) }),
      );
    });

    it('subcategory from the wrong category → null', async () => {
      prisma.catalogSubcategory.findFirst.mockResolvedValue(null);

      const result = await service.validateConfirmedTriple({
        categoryId: 'cc-other',
        subcategoryId: 'cs-1',
      });

      expect(result).toBeNull();
    });

    it('category-only confirmation: verifies existence + active', async () => {
      prisma.catalogCategory.findFirst.mockResolvedValue({ id: 'cc-1' });

      const result = await service.validateConfirmedTriple({ categoryId: 'cc-1' });

      expect(result).toEqual({ categoryId: 'cc-1', subcategoryId: null, catalogItemId: null });
    });

    it('no input at all → null (nothing to confirm)', async () => {
      const result = await service.validateConfirmedTriple({});
      expect(result).toBeNull();
    });
  });

  describe('resolvePersistableTaxonomy (deterministic tier, exact-band only)', () => {
    it('exact HIGH band with full triple → returned', async () => {
      classify.classify.mockResolvedValue({
        categoryId: 'cc-1',
        subcategoryId: 'cs-1',
        catalogItemId: 'ci-1',
        band: 'HIGH',
      });

      const result = await service.resolvePersistableTaxonomy({ name: 'CNC Lathe Machine X1', context: 'product' });

      expect(result).toEqual({ categoryId: 'cc-1', subcategoryId: 'cs-1', catalogItemId: 'ci-1' });
      expect(classify.classify).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CNC Lathe Machine X1' }),
        'system-taxonomy-persistence',
        undefined,
        { aiTier: false },
      );
    });

    it('MEDIUM band → null (never persists unconfirmed suggestions)', async () => {
      classify.classify.mockResolvedValue({
        categoryId: 'cc-1',
        subcategoryId: null,
        catalogItemId: null,
        band: 'MEDIUM',
      });

      const result = await service.resolvePersistableTaxonomy({ name: 'Widget', context: 'product' });
      expect(result).toBeNull();
    });

    it('LOW band → null (picker required)', async () => {
      classify.classify.mockResolvedValue({ categoryId: null, subcategoryId: null, catalogItemId: null, band: 'LOW' });

      const result = await service.resolvePersistableTaxonomy({ name: 'ZZZ Unknown', context: 'product' });
      expect(result).toBeNull();
    });

    it('classifier throws → null (caller keeps existing behavior)', async () => {
      classify.classify.mockRejectedValue(new Error('catalog down'));

      const result = await service.resolvePersistableTaxonomy({ name: 'Widget', context: 'product' });
      expect(result).toBeNull();
    });
  });

  describe('resolvePersistableTaxonomy (unified creation entry point)', () => {
    it('confirmed triple wins and is validated', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue(itemChain);

      const result = await service.resolvePersistableTaxonomy({
        confirmed: { catalogItemId: 'ci-1' },
        name: 'Whatever The Name Is',
        context: 'product',
        expectedType: 'Product',
      });

      expect(result).toEqual({ categoryId: 'cc-1', subcategoryId: 'cs-1', catalogItemId: 'ci-1' });
      expect(classify.classify).not.toHaveBeenCalled();
    });

    it('invalid confirmed triple falls through to deterministic classify (never fabricated)', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue(null);
      classify.classify.mockResolvedValue({
        categoryId: 'cc-2',
        subcategoryId: null,
        catalogItemId: null,
        band: 'HIGH',
      });

      const result = await service.resolvePersistableTaxonomy({
        confirmed: { catalogItemId: 'ci-bogus' },
        name: 'CNC Lathe Machine X1',
        context: 'product',
      });

      expect(result).toEqual({ categoryId: 'cc-2', subcategoryId: null, catalogItemId: null });
    });

    it('no confirmation + deterministic miss → null', async () => {
      classify.classify.mockResolvedValue({ categoryId: null, band: 'LOW' });

      const result = await service.resolvePersistableTaxonomy({
        name: 'Mystery',
        context: 'product',
      });

      expect(result).toBeNull();
    });

    it('empty name without confirmation → null without classifier call', async () => {
      const result = await service.resolvePersistableTaxonomy({ name: '', context: 'product' });
      expect(result).toBeNull();
      expect(classify.classify).not.toHaveBeenCalled();
    });
  });

  describe('bridgeLegacyCategoryId', () => {
    it('maps canonical → legacy by slug equality (synthetic layer preserved)', async () => {
      prisma.catalogCategory.findUnique.mockResolvedValue({ slug: 'cnc-machines' });
      prisma.category.findUnique.mockResolvedValue({ id: 'legacy-cat-9' });

      const result = await service.bridgeLegacyCategoryId('cc-1');

      expect(result).toBe('legacy-cat-9');
      expect(prisma.category.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'cnc-machines' } }),
      );
    });

    it('no legacy twin → null (caller keeps its own legacy value)', async () => {
      prisma.catalogCategory.findUnique.mockResolvedValue({ slug: 'brand-new-slug' });
      prisma.category.findUnique.mockResolvedValue(null);

      const result = await service.bridgeLegacyCategoryId('cc-1');
      expect(result).toBeNull();
    });
  });

  describe('tripleForCatalogItem', () => {
    it('resolves the full canonical chain for display', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue({
        id: 'ci-1',
        name: 'CNC Lathe Machine X1',
        subcategory: {
          id: 'cs-1',
          name: 'CNC Lathe',
          category: { id: 'cc-1', name: 'CNC Machines' },
        },
      });

      const result = await service.tripleForCatalogItem('ci-1', 'Service');

      expect(result).toEqual({
        categoryId: 'cc-1',
        subcategoryId: 'cs-1',
        catalogItemId: 'ci-1',
        categoryName: 'CNC Machines',
        subcategoryName: 'CNC Lathe',
        itemName: 'CNC Lathe Machine X1',
      });
    });

    it('unknown item → null', async () => {
      prisma.catalogItem.findFirst.mockResolvedValue(null);
      expect(await service.tripleForCatalogItem('nope')).toBeNull();
    });
  });

  describe('classifyValidated (P0-3 Step-1 adapter)', () => {
    const canonicalHit = {
      categoryId: 'cc-1',
      subcategoryId: 'cs-1',
      catalogItemId: 'ci-1',
      type: 'Product',
      confidence: 1.0,
      band: 'HIGH',
      matchType: 'exact',
      reasons: ['exact name match'],
      alternatives: [],
      categoryName: 'CNC Machines',
      subcategoryName: 'CNC Lathe',
    };

    it('passes through a server-verified canonical result with confidence + band', async () => {
      classify.classify.mockResolvedValue(canonicalHit);
      prisma.catalogItem.findFirst.mockResolvedValue(itemChain);

      const result = await service.classifyValidated(
        { name: 'CNC Lathe Machine X1', context: 'product' },
        'company-1',
        'user-1',
      );

      expect(result).toEqual(canonicalHit);
      expect(classify.classify).toHaveBeenCalledWith(
        { name: 'CNC Lathe Machine X1', context: 'product' },
        'company-1',
        'user-1',
        { aiTier: undefined },
      );
    });

    it('degrades unverifiable classifier output to honest LOW/unclassified (never fabricated)', async () => {
      classify.classify.mockResolvedValue({ ...canonicalHit, catalogItemId: 'ci-bogus' });
      prisma.catalogItem.findFirst.mockResolvedValue(null);

      const result = await service.classifyValidated({ name: 'Widget' });

      expect(result.categoryId).toBeNull();
      expect(result.catalogItemId).toBeNull();
      expect(result.band).toBe('LOW');
      expect(result.matchType).toBe('unclassified');
    });

    it('returns empty results untouched (no validation round-trip)', async () => {
      const empty = {
        categoryId: null, subcategoryId: null, catalogItemId: null, type: null,
        confidence: 0.2, band: 'LOW', matchType: 'fallback', reasons: ['none'], alternatives: [],
      };
      classify.classify.mockResolvedValue(empty);

      const result = await service.classifyValidated({ name: 'zzz' });

      expect(result).toEqual(empty);
      expect(prisma.catalogItem.findFirst).not.toHaveBeenCalled();
    });

    it('classifier throw → honest LOW/unclassified (never thrown upward)', async () => {
      classify.classify.mockRejectedValue(new Error('catalog down'));

      const result = await service.classifyValidated({ name: 'Widget' });

      expect(result.matchType).toBe('unclassified');
      expect(result.band).toBe('LOW');
    });

    it('forwards aiTier:false for deterministic callers', async () => {
      classify.classify.mockResolvedValue(canonicalHit);
      prisma.catalogItem.findFirst.mockResolvedValue(itemChain);

      await service.classifyValidated({ name: 'X' }, 'c', 'u', { aiTier: false });

      expect(classify.classify).toHaveBeenCalledWith(
        { name: 'X' }, 'c', 'u', { aiTier: false },
      );
    });
  });

  describe('applyCanonicalTriple (P1 O-1/O-5 atomic lineage writer)', () => {
    it('maps a verified triple to all three Prisma columns together', () => {
      expect(
        service.applyCanonicalTriple({ categoryId: 'cc-1', subcategoryId: 'cs-1', catalogItemId: 'ci-1' }),
      ).toEqual({ catalogItemId: 'ci-1', catalogCategoryId: 'cc-1', catalogSubcategoryId: 'cs-1' });
    });

    it('preserves a null subcategory (category-level lineage stays intact)', () => {
      expect(
        service.applyCanonicalTriple({ categoryId: 'cc-1', subcategoryId: null, catalogItemId: null }),
      ).toEqual({ catalogItemId: null, catalogCategoryId: 'cc-1', catalogSubcategoryId: null });
    });

    it('null input clears the ENTIRE triple (never item-only)', () => {
      expect(service.applyCanonicalTriple(null)).toEqual({
        catalogItemId: null, catalogCategoryId: null, catalogSubcategoryId: null,
      });
    });
  });
});
