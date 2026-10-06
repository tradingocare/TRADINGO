import { MarketplaceCatalogBridgeService } from './marketplace-catalog-bridge.service';

/**
 * F-07 cascade picker read (scratch-unit spec): listSubcategoryItems.
 * Unit-owned counterpart of the items-endpoint cases (the mixed-ownership
 * service spec stays with its Phase-14/P0-3 owners in the primary tree).
 */
describe('MarketplaceCatalogBridgeService.listSubcategoryItems (F-07)', () => {
  let svc: any;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      catalogSubcategory: { findUnique: jest.fn() },
      catalogItem: { findMany: jest.fn(), count: jest.fn() },
    };
    const adapter: any = { getCatalogTree: jest.fn().mockResolvedValue([]) };
    svc = new (MarketplaceCatalogBridgeService as any)(prisma, adapter);
  });

  it('returns active items scoped to the parent with pagination meta', async () => {
    prisma.catalogSubcategory.findUnique.mockResolvedValue({ id: 'cs-1', categoryId: 'cc-1' });
    prisma.catalogItem.findMany.mockResolvedValue([{ id: 'ci-1', name: 'MS Pipes', slug: 'ms-pipes', type: 'Product' }]);
    prisma.catalogItem.count.mockResolvedValue(1);

    const result = await svc.listSubcategoryItems('cs-1', 1, 50);

    expect(prisma.catalogItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { subcategoryId: 'cs-1', isActive: true },
    }));
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual(expect.objectContaining({ total: 1, page: 1, subcategoryId: 'cs-1', categoryId: 'cc-1' }));
  });

  it('404s on unknown parent instead of returning an arbitrary list', async () => {
    prisma.catalogSubcategory.findUnique.mockResolvedValue(null);

    await expect(svc.listSubcategoryItems('cs-nope')).rejects.toThrow('Catalog subcategory not found');

    expect(prisma.catalogItem.findMany).not.toHaveBeenCalled();
  });

  it('clamps pagination bounds', async () => {
    prisma.catalogSubcategory.findUnique.mockResolvedValue({ id: 'cs-1', categoryId: 'cc-1' });
    prisma.catalogItem.findMany.mockResolvedValue([]);
    prisma.catalogItem.count.mockResolvedValue(0);

    const result = await svc.listSubcategoryItems('cs-1', -3, 5000);

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(100);
  });
});
