import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import {
  ProductPricingService,
  selectSlabForQuantity,
} from '../product-pricing.service';
import { PrismaService } from '../../../../prisma/prisma.service';

const D = (v: string) => new Prisma.Decimal(v);

describe('ProductPricingService (R1 — server-authoritative pricing)', () => {
  let service: ProductPricingService;
  let prisma: { product: { findFirst: jest.Mock } };

  const slab = (id: string, minQty: number, maxQty: number | null, price: string, currency = 'INR') =>
    ({ id, minQty, maxQty, price: D(price), currency });

  const product = (slabs: ReturnType<typeof slab>[], overrides: Record<string, unknown> = {}) => ({
    id: 'prod-1',
    slug: 'test-product',
    moq: 1,
    priceSlabs: slabs,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = { product: { findFirst: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductPricingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ProductPricingService);
  });

  it('1. resolves the exact first slab minQty', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '100.00'),
      slab('s2', 50, null, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 1);
    expect(r.purchasable).toBe(true);
    expect(r.reason).toBe('OK');
    expect(r.slab?.id).toBe('s1');
    expect(r.unitPrice).toBe('100.00');
    expect(r.subtotal).toBe('100.00');
  });

  it('2. resolves inside the first slab', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '100.00'),
      slab('s2', 50, null, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 25);
    expect(r.slab?.id).toBe('s1');
    expect(r.unitPrice).toBe('100.00');
    expect(r.subtotal).toBe('2500.00');
  });

  it('3. resolves the exact first slab maxQty (inclusive bound)', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '100.00'),
      slab('s2', 50, null, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 49);
    expect(r.slab?.id).toBe('s1');
    expect(r.unitPrice).toBe('100.00');
  });

  it('4. resolves the exact next slab minQty (volume tier)', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '100.00'),
      slab('s2', 50, null, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 50);
    expect(r.slab?.id).toBe('s2');
    expect(r.unitPrice).toBe('90.00');
    expect(r.subtotal).toBe('4500.00');
  });

  it('5. is NOT purchasable between slab ranges (gap)', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 10, '100.00'),
      slab('s2', 20, 30, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 15);
    expect(r.purchasable).toBe(false);
    expect(r.reason).toBe('QUANTITY_BETWEEN_SLABS');
    expect(r.unitPrice).toBeNull();
    expect(r.subtotal).toBeNull();
    expect(r.slab).toBeNull();
    expect(r.message).toContain('15');
  });

  it('6. is NOT purchasable above the final bounded slab', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '100.00'),
      slab('s2', 50, 100, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 101);
    expect(r.purchasable).toBe(false);
    expect(r.reason).toBe('QUANTITY_ABOVE_FINAL_SLAB');
    expect(r.message).toContain('100');
  });

  it('7. is NOT purchasable below the first slab', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 10, 49, '100.00'),
      slab('s2', 50, 100, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 5);
    expect(r.purchasable).toBe(false);
    expect(r.reason).toBe('QUANTITY_BELOW_FIRST_SLAB');
    expect(r.message).toContain('10');
  });

  it('8. is NOT purchasable when the product has no slabs', async () => {
    prisma.product.findFirst.mockResolvedValue(product([]));
    const r = await service.resolvePricing('prod-1', 5);
    expect(r.purchasable).toBe(false);
    expect(r.reason).toBe('NO_SLABS');
    expect(r.displayPrice).toBeNull();
  });

  it.each([0, -3, 2.5, Number.NaN])('9. rejects invalid quantity %s', async (qty) => {
    prisma.product.findFirst.mockResolvedValue(product([slab('s1', 1, 49, '100.00')]));
    const r = await service.resolvePricing('prod-1', qty);
    expect(r.purchasable).toBe(false);
    expect(r.reason).toBe('INVALID_QUANTITY');
    expect(r.unitPrice).toBeNull();
    expect(r.subtotal).toBeNull();
  });

  it('10. deterministically selects the largest minQty among overlapping slabs', async () => {
    // Overlap only possible with data that bypassed write-time validation:
    // qty 60 matches BOTH [1, null] and [50, 60] — the [50, 60] tier wins.
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, null, '100.00'),
      slab('s2', 50, 60, '80.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 60);
    expect(r.slab?.id).toBe('s2');
    expect(r.unitPrice).toBe('80.00');
  });

  it('11. an unbounded final slab covers quantities above bounded tiers', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, null, '100.00'),
      slab('s2', 50, 60, '80.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 100);
    expect(r.slab?.id).toBe('s1');
    expect(r.unitPrice).toBe('100.00');
  });

  it('12. tie-break prefers the tighter maxQty, then stored order', async () => {
    const tight = slab('tight', 1, 60, '95.00');
    const loose = slab('loose', 1, 100, '100.00');
    prisma.product.findFirst.mockResolvedValue(product([loose, tight]));
    const r = await service.resolvePricing('prod-1', 50);
    expect(r.slab?.id).toBe('tight');
    expect(r.unitPrice).toBe('95.00');

    // Identical ranges: the earliest slab in stored order wins.
    const first = slab('first', 1, 60, '90.00');
    const second = slab('second', 1, 60, '91.00');
    prisma.product.findFirst.mockResolvedValue(product([first, second]));
    const r2 = await service.resolvePricing('prod-1', 50);
    expect(r2.slab?.id).toBe('first');
  });

  it('13. computes exact Decimal money with no floating-point drift', async () => {
    prisma.product.findFirst.mockResolvedValue(product([slab('s1', 1, null, '1234.56')]));
    const r = await service.resolvePricing('prod-1', 3);
    expect(r.unitPrice).toBe('1234.56');
    expect(r.subtotal).toBe('3703.68');
  });

  it('14. subtotal is always unitPrice × quantity', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '137.75'),
      slab('s2', 50, null, '122.25'),
    ]));
    const r = await service.resolvePricing('prod-1', 75);
    expect(r.unitPrice).toBe('122.25');
    expect(Number(r.subtotal)).toBe(Number(r.unitPrice) * 75);
    expect(r.subtotal).toBe('9168.75');
  });

  it('15. accepts no price input — resolution takes only (productId, quantity)', async () => {
    // Arity proves there is no parameter through which a client can
    // supply or override a price.
    expect(service.resolvePricing.length).toBe(2);
    // A display reference price (originalPrice) never becomes transactional.
    prisma.product.findFirst.mockResolvedValue(product(
      [slab('s1', 1, 49, '100.00')],
      { originalPrice: D('999.00') },
    ));
    const r = await service.resolvePricing('prod-1', 10);
    expect(r.unitPrice).toBe('100.00');
    expect(r.subtotal).toBe('1000.00');
  });

  it('16. returns PRODUCT_NOT_FOUND for unknown products', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    const r = await service.resolvePricing('missing', 5);
    expect(r.purchasable).toBe(false);
    expect(r.reason).toBe('PRODUCT_NOT_FOUND');
    expect(r.unitPrice).toBeNull();
    expect(r.slab).toBeNull();
  });

  it('17. reports the winning slab currency', async () => {
    prisma.product.findFirst.mockResolvedValue(product([slab('s1', 1, null, '10.00', 'USD')]));
    const r = await service.resolvePricing('prod-1', 2);
    expect(r.currency).toBe('USD');
    expect(r.slab?.currency).toBe('USD');
  });

  it('18. exposes the first-slab display price (UI only)', async () => {
    prisma.product.findFirst.mockResolvedValue(product([
      slab('s1', 1, 49, '100.00'),
      slab('s2', 50, null, '90.00'),
    ]));
    const r = await service.resolvePricing('prod-1', 60);
    expect(r.displayPrice).toBe('100.00');
  });

  describe('selectSlabForQuantity (pure)', () => {
    it('returns null for empty slabs', () => {
      expect(selectSlabForQuantity([], 5)).toBeNull();
    });

    it('returns null when the quantity falls in a gap', () => {
      const slabs = [slab('a', 1, 10, '1.00'), slab('b', 20, 30, '2.00')];
      expect(selectSlabForQuantity(slabs, 15)).toBeNull();
    });
  });
});
