import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  fromDiscoveryResult,
  fromNearMeProduct,
  fromEnrichedProduct,
  fromProductCardData,
  fromBasicProduct,
  fromWishlistItem,
} from '@/components/product/card-converters';

/**
 * R4 — Product Card data integrity.
 * Proves no converter fabricates rating, GOCASH reward, or stock
 * availability, and that authoritative sources map correctly while
 * unknown data stays unavailable (never assumed available).
 */
const CONVERTER_SRC = readFileSync(join(__dirname, '..', 'card-converters.ts'), 'utf8');
const TRADING_CLIENT_SRC = readFileSync(
  join(__dirname, '..', '..', '..', 'app', 'trading', 'TradingDiscoveryClient.tsx'),
  'utf8',
);

const discoveryBase: any = {
  id: 'd1',
  slug: 'drill-machine',
  name: 'Drill Machine',
  images: [],
  categoryName: 'Tools',
  trustScore: 80,
  seller: { id: 'c1', name: 'Tools Co', isVerified: true, trustScore: 80 },
  rating: 0,
  reviewCount: 0,
  price: 500,
  inStock: true,
};

const nearMeBase: any = {
  id: 'n1',
  productId: 'p1',
  slug: 'cement',
  name: 'Cement Bag',
  price: 2500,
  moq: 5,
  unit: 'bag',
  categoryName: 'Building',
  seller: {
    id: 'c1', name: 'Build Co', slug: 'build-co', isVerified: true,
    trustScore: 70, isElite: false, gstVerified: true, rating: 4.5,
  },
  trustScore: 70,
  isTradgo: false,
  distanceKm: 2,
  distanceLabel: '2 km',
};

const enrichedBase: any = {
  id: 'e1',
  slug: 'steel-coil',
  name: 'Steel Coil',
  priceSlabs: [{ minQty: 1, maxQty: null, price: 100 }],
  company: { id: 'c1', name: 'Steel Co', verificationLevel: 'LEVEL_2', trustScore: 85 },
  trustScoreSnapshot: 85,
  status: 'ACTIVE',
  inventory: { availableQuantity: 10, stockStatus: 'IN_STOCK' },
};

const cardDataBase: any = {
  _id: 'pcd1',
  slug: 'copper-wire',
  title: 'Copper Wire',
  images: [],
  categoryName: 'Electrical',
  subCategory: '',
  price: 50,
  unit: 'm',
  rating: 0,
  reviewCount: 0,
  moq: 1,
  priceSlabs: [{ minQty: 1, maxQty: null, price: 50 }],
  seller: { id: 'c1', _id: 'c1', businessName: 'Wire Co', isVerified: true, trustScore: 75, city: 'Mumbai' },
  inStock: true,
  stockQty: 40,
};

const basicBase: any = {
  id: 'b1',
  slug: 'pvc-pipe',
  name: 'PVC Pipe',
  priceSlabs: [{ minQty: 1, maxQty: null, price: 30 }],
  companyId: 'c1',
  companyName: 'Pipe Co',
  inventory: { availableQuantity: 25, stockStatus: 'IN_STOCK' },
};

const wishlistBase: any = {
  product: {
    id: 'w1',
    name: 'Safety Helmet',
    slug: 'safety-helmet',
    unit: 'pc',
    moq: 1,
    priceSlabs: [{ minQty: 1, maxQty: null, price: 450 }],
    inventory: { availableQuantity: 12, stockStatus: 'IN_STOCK' },
    seller: {
      id: 'c1', name: 'Safe Co', slug: 'safe-co', isVerified: true,
      trustScore: 82, isTradgoElite: false, gstVerified: true,
    },
    rating: 0,
    reviewCount: 0,
    inStock: true,
  },
};

describe('R4 rating integrity', () => {
  it('1. trust score cannot become a 5-star rating', () => {
    const m = fromEnrichedProduct({ ...enrichedBase });
    expect(m.rating).toBe(0);
    expect(m.reviewCount).toBe(0);
    const contaminated = fromEnrichedProduct({ ...enrichedBase, rating: 85, reviewCount: 3 });
    expect(contaminated.rating).toBe(0);
    expect(contaminated.reviewCount).toBe(0);
  });

  it('2. approved review stats are used when present', () => {
    const m = fromEnrichedProduct({ ...enrichedBase, rating: 4.5, reviewCount: 12 });
    expect(m.rating).toBe(4.5);
    expect(m.reviewCount).toBe(12);
    const b = fromBasicProduct({ ...basicBase, rating: 4.0, reviewCount: 7 });
    expect(b.rating).toBe(4.0);
    expect(b.reviewCount).toBe(7);
  });

  it('3. missing review stats do not fabricate a rating on any path', () => {
    expect(fromDiscoveryResult({ ...discoveryBase })).toMatchObject({ rating: 0, reviewCount: 0 });
    expect(fromNearMeProduct({ ...nearMeBase })).toMatchObject({ rating: 0, reviewCount: 0 });
    expect(fromEnrichedProduct({ ...enrichedBase })).toMatchObject({ rating: 0, reviewCount: 0 });
    expect(fromProductCardData({ ...cardDataBase })).toMatchObject({ rating: 0, reviewCount: 0 });
    expect(fromBasicProduct({ ...basicBase })).toMatchObject({ rating: 0, reviewCount: 0 });
    expect(fromWishlistItem({ ...wishlistBase })).toMatchObject({ rating: 0, reviewCount: 0 });
  });

  it('4. review count passes through exactly when valid', () => {
    const m = fromProductCardData({ ...cardDataBase, rating: 3.5, reviewCount: 21 });
    expect(m.rating).toBe(3.5);
    expect(m.reviewCount).toBe(21);
  });
});

describe('R4 GOCASH integrity', () => {
  it('5. product price does not determine GOCASH on any path', () => {
    expect(fromDiscoveryResult({ ...discoveryBase, price: 50000 }).gocashEarn).toBeUndefined();
    expect(fromNearMeProduct({ ...nearMeBase }).gocashEarn).toBeUndefined();
    expect(fromEnrichedProduct({ ...enrichedBase }).gocashEarn).toBeUndefined();
    expect(fromProductCardData({ ...cardDataBase }).gocashEarn).toBeUndefined();
    expect(fromBasicProduct({ ...basicBase }).gocashEarn).toBeUndefined();
    expect(fromWishlistItem({ ...wishlistBase }).gocashEarn).toBeUndefined();
  });

  it('6. the fabricated floor(price/1000)*100 calculation is absent from the source', () => {
    expect(CONVERTER_SRC).not.toMatch(/Math\.floor/);
    expect(CONVERTER_SRC).not.toMatch(/function gocashEarn/);
    expect(CONVERTER_SRC).not.toMatch(/price\s*\/\s*1000/);
  });

  it('7. the Rs.50 completion reward appears only with authoritative backing (never per-product)', () => {
    // No product-level authoritative earn field exists: the flat Rs.50 is
    // an order-completion event reward, so no card may display it.
    expect(fromEnrichedProduct({ ...enrichedBase }).gocashEarn).toBeUndefined();
  });

  it('8. milestone reward data is not fabricated on cards', () => {
    expect(fromBasicProduct({ ...basicBase, monthlyOrders: 120 }).gocashEarn).toBeUndefined();
  });
});

describe('R4 stock integrity', () => {
  it('9. no hardcoded inStock:true default exists in converter or caller sources', () => {
    expect(CONVERTER_SRC).not.toMatch(/inStock:\s*true/);
    expect(TRADING_CLIENT_SRC).not.toMatch(/inStock:\s*true/);
  });

  it('10. authoritative stock maps correctly (status and quantity)', () => {
    expect(fromEnrichedProduct({ ...enrichedBase }).inStock).toBe(true);
    expect(
      fromEnrichedProduct({
        ...enrichedBase,
        inventory: { availableQuantity: 3, stockStatus: 'LOW_STOCK' },
      }).inStock,
    ).toBe(true);
    expect(
      fromEnrichedProduct({
        ...enrichedBase,
        inventory: { availableQuantity: 0, stockStatus: 'OUT_OF_STOCK' },
      }).inStock,
    ).toBe(false);
    expect(
      fromEnrichedProduct({ ...enrichedBase, inventory: { availableQuantity: 5 } }).inStock,
    ).toBe(true);
    expect(fromEnrichedProduct({ ...enrichedBase, inventory: { availableQuantity: 0 } }).inStock).toBe(false);
  });

  it('11. unknown stock resolves to unavailable (never assumed available)', () => {
    expect(fromDiscoveryResult({ ...discoveryBase, inStock: undefined }).inStock).toBe(false);
    expect(fromNearMeProduct({ ...nearMeBase }).inStock).toBe(false);
    expect(fromEnrichedProduct({ ...enrichedBase, inventory: undefined, stock: undefined }).inStock).toBe(false);
    expect(fromBasicProduct({ ...basicBase, inventory: undefined, stock: undefined }).inStock).toBe(false);
    expect(fromWishlistItem({ ...wishlistBase, product: { ...wishlistBase.product, inventory: undefined } }).inStock).toBe(false);
  });

  it('12. NearMeProduct fabricates nothing (rating, count, stock, reward)', () => {
    const m = fromNearMeProduct({ ...nearMeBase });
    expect(m.rating).toBe(0);
    expect(m.reviewCount).toBe(0);
    expect(m.inStock).toBe(false);
    expect(m.gocashEarn).toBeUndefined();
    expect(m.price).toBe(2500);
  });
});

describe('R4 converter consistency', () => {
  it('13. every converter path produces a structurally valid model', () => {
    const models = [
      fromDiscoveryResult({ ...discoveryBase }),
      fromNearMeProduct({ ...nearMeBase }),
      fromEnrichedProduct({ ...enrichedBase }),
      fromProductCardData({ ...cardDataBase }),
      fromBasicProduct({ ...basicBase }),
      fromWishlistItem({ ...wishlistBase }),
    ];
    for (const m of models) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.title).toBe('string');
      expect(typeof m.price).toBe('number');
      expect(m.rating).toBeGreaterThanOrEqual(0);
      expect(m.rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(m.reviewCount)).toBe(true);
      expect(m.reviewCount).toBeGreaterThanOrEqual(0);
      expect(typeof m.inStock).toBe('boolean');
      expect(m.gocashEarn).toBeUndefined();
    }
  });

  it('14. previously wrong stock mappings are corrected', () => {
    // ACTIVE status alone must not imply stock.
    expect(
      fromEnrichedProduct({ ...enrichedBase, inventory: undefined, stock: undefined, status: 'ACTIVE' }).inStock,
    ).toBe(false);
    // Slab presence alone must not imply stock.
    expect(
      fromBasicProduct({ ...basicBase, inventory: undefined, stock: undefined, inStock: undefined }).inStock,
    ).toBe(false);
  });

  it('15. no converter fabricates financial, reward, or rating data on adversarial input', () => {
    const hostile: any = {
      ...enrichedBase,
      rating: 99,
      reviewCount: 1000000,
      trustScoreSnapshot: 100,
      inventory: undefined,
      stock: undefined,
    };
    const m = fromEnrichedProduct(hostile);
    expect(m.rating).toBe(0);
    expect(m.reviewCount).toBe(0);
    expect(m.inStock).toBe(false);
    expect(m.gocashEarn).toBeUndefined();
  });
});

describe('R4 regression', () => {
  it('16. converter identity contract remains valid', () => {
    const m = fromDiscoveryResult({ ...discoveryBase });
    expect(m.id).toBe('d1');
    expect(m.slug).toBe('drill-machine');
    expect(m.title).toBe('Drill Machine');
    expect(m.seller.name).toBe('Tools Co');
    expect(m.trustScoreSnapshot).toBe(80);
  });

  it('17. R1 authoritative display-price behavior remains intact', () => {
    const withSlabs = fromEnrichedProduct({
      ...enrichedBase,
      priceSlabs: [
        { minQty: 1, maxQty: 49, price: 100 },
        { minQty: 50, maxQty: null, price: 90 },
      ],
    });
    expect(withSlabs.price).toBe(100);
    const msrpOnly = fromEnrichedProduct({ ...enrichedBase, priceSlabs: [], originalPrice: 999 });
    expect(msrpOnly.price).toBe(999);
    const unpriced = fromEnrichedProduct({ ...enrichedBase, priceSlabs: [], originalPrice: undefined });
    expect(unpriced.price).toBe(0);
  });

  it('18. wishlist availability and on-hand count come from the carried inventory row', () => {
    const m = fromWishlistItem({ ...wishlistBase });
    expect(m.inStock).toBe(true);
    expect(m.stockQty).toBe(12);
    const empty = fromWishlistItem({
      ...wishlistBase,
      product: { ...wishlistBase.product, inventory: { availableQuantity: 0, stockStatus: 'OUT_OF_STOCK' } },
    });
    expect(empty.inStock).toBe(false);
  });
});
