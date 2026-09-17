import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service';
import { SellerProductService } from './seller-product.service';
import { MembershipService } from '../membership/membership.service';

// P0-2 (F-01): seller creation paths persist the canonical triple.
// quickCreateProduct / createProduct / duplicateProduct / updateProduct.

describe('SellerProductService canonical taxonomy persistence (P0-2)', () => {
  let service: SellerProductService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let taxonomy: {
    resolvePersistableTaxonomy: jest.Mock;
    validateConfirmedTriple: jest.Mock;
    bridgeLegacyCategoryId: jest.Mock;
    applyCanonicalTriple: jest.Mock;
  };

  const canonical = { categoryId: 'cc-1', subcategoryId: 'cs-1', catalogItemId: 'ci-1' };
  const company = { id: 'company-1', slug: 'test-co', subscriptionPlan: 'trade_elite' };

  beforeEach(async () => {
    prisma = {
      companyOwner: { findFirst: jest.fn().mockResolvedValue({ companyId: 'company-1', company }) },
      company: { findUnique: jest.fn().mockResolvedValue(company), findFirst: jest.fn() },
      product: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'prod-1', ...data })),
        // createProduct/updateProduct/duplicateProduct re-fetch via
        // getProduct → findFirst; return a company-scoped row.
        findFirst: jest.fn().mockResolvedValue({ id: 'prod-1', companyId: 'company-1', slug: 'slug', catalogItemId: 'ci-1' }),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({ id: 'prod-1' }),
      },
      productSpecification: { createMany: jest.fn(), deleteMany: jest.fn() },
      productPriceSlab: { createMany: jest.fn(), deleteMany: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      productMedia: { createMany: jest.fn(), deleteMany: jest.fn() },
      productInventory: { create: jest.fn(), upsert: jest.fn() },
    };

    taxonomy = {
      resolvePersistableTaxonomy: jest.fn().mockResolvedValue(canonical),
      validateConfirmedTriple: jest.fn().mockResolvedValue(canonical),
      bridgeLegacyCategoryId: jest.fn().mockResolvedValue('legacy-7'),
      // P1 O-1/O-5 mock remedy: expose the real helper (prototype delegation —
      // zero duplication, always contract-faithful) instead of re-implementing it.
      applyCanonicalTriple: jest.fn(CatalogTaxonomyPersistenceService.prototype.applyCanonicalTriple),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerProductService,
        { provide: PrismaService, useValue: prisma },
        { provide: SearchService, useValue: { indexDocument: jest.fn() } },
        { provide: MembershipService, useValue: { enforcePriceTierLimit: jest.fn(), getVersionedEntitlements: jest.fn().mockResolvedValue(null) } },
        { provide: CatalogTaxonomyPersistenceService, useValue: taxonomy },
      ],
    }).compile();
    service = module.get(SellerProductService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('createProduct persists canonical IDs from a confirmed triple + bridges legacy', async () => {
    await service.createProduct('user-1', {
      name: 'CNC Lathe Machine X1',
      catalogItemId: 'ci-1',
      catalogCategoryId: 'cc-1',
      catalogSubcategoryId: 'cs-1',
    } as any);

    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.catalogItemId).toBe('ci-1');
    // No explicit legacy categoryId → bridged from the canonical category.
    expect(taxonomy.bridgeLegacyCategoryId).toHaveBeenCalledWith('cc-1');
    expect(createCall.data.categoryId).toBe('legacy-7');
  });

  it('createProduct keeps an explicit legacy categoryId (never overridden)', async () => {
    await service.createProduct('user-1', {
      name: 'CNC Lathe Machine X1',
      categoryId: 'legacy-9',
    } as any);

    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.categoryId).toBe('legacy-9');
    expect(taxonomy.bridgeLegacyCategoryId).not.toHaveBeenCalled();
  });

  it('createProduct falls back to deterministic classify when no triple is confirmed', async () => {
    await service.createProduct('user-1', { name: 'CNC Lathe Machine X1' } as any);

    expect(taxonomy.resolvePersistableTaxonomy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CNC Lathe Machine X1', context: 'product' }),
    );
    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.catalogItemId).toBe('ci-1');
  });

  it('quickCreateProduct persists canonical lineage via deterministic classify (quick-list test E)', async () => {
    await service.quickCreateProduct('user-1', { name: 'CNC Lathe Machine X1' });

    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.catalogItemId).toBe('ci-1');
    expect(createCall.data.categoryId).toBe('legacy-7');
  });

  it('quickCreateProduct with unresolvable name keeps zero-loss behavior (uncategorized, no fabrication)', async () => {
    taxonomy.resolvePersistableTaxonomy.mockResolvedValue(null);

    await service.quickCreateProduct('user-1', { name: 'Totally Unknown Widget' });

    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.catalogItemId).toBeNull();
    expect(createCall.data.categoryId).toBeUndefined();
  });

  it('updateProduct with a confirmed triple persists the FULL canonical lineage (Tick/Change)', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', companyId: 'company-1', slug: 's', catalogItemId: null });
    prisma.product.update.mockResolvedValue({ id: 'prod-1' });

    await service.updateProduct('user-1', 'prod-1', {
      catalogItemId: 'ci-1',
      catalogCategoryId: 'cc-1',
    } as any);

    const updateCall = prisma.product.update.mock.calls[0][0];
    // P1 O-1: item + category columns move together (create-path parity).
    expect(updateCall.data.catalogItemId).toBe('ci-1');
    expect(updateCall.data.catalogCategoryId).toBe('cc-1');
    expect(updateCall.data.catalogSubcategoryId).toBe('cs-1');
  });

  it('updateProduct with an explicit all-null triple clears the ENTIRE lineage (never item-only)', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'prod-1', companyId: 'company-1', slug: 's',
      catalogItemId: 'ci-1', catalogCategoryId: 'cc-1', catalogSubcategoryId: 'cs-1',
    });
    prisma.product.update.mockResolvedValue({ id: 'prod-1' });

    await service.updateProduct('user-1', 'prod-1', {
      catalogItemId: null,
      catalogCategoryId: null,
      catalogSubcategoryId: null,
    } as any);

    const updateCall = prisma.product.update.mock.calls[0][0];
    expect(updateCall.data.catalogItemId).toBeNull();
    expect(updateCall.data.catalogCategoryId).toBeNull();
    expect(updateCall.data.catalogSubcategoryId).toBeNull();
  });

  it('updateProduct without taxonomy keys leaves persisted lineage untouched (rename-safe)', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'prod-1', companyId: 'company-1', slug: 's',
      catalogItemId: 'ci-1', catalogCategoryId: 'cc-1', catalogSubcategoryId: 'cs-1',
    });
    prisma.product.update.mockResolvedValue({ id: 'prod-1' });

    await service.updateProduct('user-1', 'prod-1', { name: 'Renamed Widget' } as any);

    const updateCall = prisma.product.update.mock.calls[0][0];
    expect(updateCall.data.name).toBe('Renamed Widget');
    expect(updateCall.data.catalogItemId).toBeUndefined();
    expect(updateCall.data.catalogCategoryId).toBeUndefined();
    expect(updateCall.data.catalogSubcategoryId).toBeUndefined();
    expect(taxonomy.validateConfirmedTriple).not.toHaveBeenCalled();
  });

  it('updateProduct rejects an INVALID confirmed triple (never fabricated)', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', companyId: 'company-1', slug: 's' });
    taxonomy.validateConfirmedTriple.mockResolvedValue(null);

    await expect(
      service.updateProduct('user-1', 'prod-1', { catalogItemId: 'ci-bogus' } as any),
    ).rejects.toThrow('Invalid canonical taxonomy');

    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('duplicateProduct carries the FULL canonical lineage to the copy (never item-only)', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'prod-1',
      companyId: 'company-1',
      categoryId: 'legacy-9',
      catalogItemId: 'ci-1',
      catalogCategoryId: 'cc-1',
      catalogSubcategoryId: 'cs-1',
      name: 'Original',
      slug: 'orig',
      slugDup: undefined,
      media: [],
      specifications: [],
      priceSlabs: [],
      inventory: null,
    });

    await service.duplicateProduct('user-1', 'prod-1');

    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.catalogItemId).toBe('ci-1');
    expect(createCall.data.catalogCategoryId).toBe('cc-1');
    expect(createCall.data.catalogSubcategoryId).toBe('cs-1');
  });

  it('getProduct 404s for another company product (ownership unchanged)', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.getProduct('user-1', 'prod-x')).rejects.toThrow(NotFoundException);
  });

  // O-4: quick-list slug precheck (mirrors create/update clean-400 behavior).
  it('quickCreateProduct with an available slug succeeds', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await service.quickCreateProduct('user-1', { name: 'CNC Lathe Machine X1' });

    expect(prisma.product.create).toHaveBeenCalled();
  });

  it('quickCreateProduct with an existing slug returns a clean 400 (no write)', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'other-1', slug: 'cnc-lathe-machine-x1' });

    await expect(
      service.quickCreateProduct('user-1', { name: 'CNC Lathe Machine X1' }),
    ).rejects.toThrow('Slug "cnc-lathe-machine-x1" already exists');

    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('createProduct slug precheck remains intact (existing behavior)', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'other-1', slug: 'cnc-lathe-machine-x1' });

    await expect(
      service.createProduct('user-1', { name: 'CNC Lathe Machine X1' } as any),
    ).rejects.toThrow('already exists');

    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  // O-3r: duplicate rejects stale canonical lineage (REJECT semantics).
  const staleOriginal = () => ({
    id: 'prod-1',
    companyId: 'company-1',
    categoryId: 'legacy-9',
    catalogItemId: 'ci-1',
    catalogCategoryId: 'cc-1',
    catalogSubcategoryId: 'cs-1',
    name: 'Original',
    slug: 'orig',
    media: [],
    specifications: [],
    priceSlabs: [],
    inventory: null,
  });

  it('duplicateProduct validates the source triple and preserves it when live', async () => {
    prisma.product.findFirst.mockResolvedValue(staleOriginal());

    await service.duplicateProduct('user-1', 'prod-1');

    expect(taxonomy.validateConfirmedTriple).toHaveBeenCalledWith({
      categoryId: 'cc-1',
      subcategoryId: 'cs-1',
      catalogItemId: 'ci-1',
      expectedType: 'Product',
    });
    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.catalogItemId).toBe('ci-1');
    expect(createCall.data.catalogCategoryId).toBe('cc-1');
    expect(createCall.data.catalogSubcategoryId).toBe('cs-1');
  });

  it('duplicateProduct with a stale source item is REJECTED cleanly', async () => {
    prisma.product.findFirst.mockResolvedValue(staleOriginal());
    taxonomy.validateConfirmedTriple.mockResolvedValue(null);

    await expect(service.duplicateProduct('user-1', 'prod-1')).rejects.toThrow(
      'Cannot duplicate product: its catalog classification is stale or invalid',
    );
  });

  it('rejected stale duplicate creates no Product and mutates nothing', async () => {
    prisma.product.findFirst.mockResolvedValue(staleOriginal());
    taxonomy.validateConfirmedTriple.mockResolvedValue(null);

    await expect(service.duplicateProduct('user-1', 'prod-1')).rejects.toThrow(BadRequestException);

    expect(prisma.product.create).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('duplicateProduct of an uncategorized original skips validation and succeeds', async () => {
    prisma.product.findFirst.mockResolvedValue({
      ...staleOriginal(),
      catalogItemId: null,
      catalogCategoryId: null,
      catalogSubcategoryId: null,
    });

    await service.duplicateProduct('user-1', 'prod-1');

    expect(taxonomy.validateConfirmedTriple).not.toHaveBeenCalled();
    expect(prisma.product.create).toHaveBeenCalled();
  });
});
