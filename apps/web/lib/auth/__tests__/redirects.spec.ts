import { getSellerEntryTarget, resolvePostLoginTarget, getGoLiveEntryTarget } from '../redirects';

describe('getSellerEntryTarget', () => {
  it('routes an authenticated BUYER to existing-user vendor onboarding', () => {
    expect(getSellerEntryTarget('BUYER')).toBe('/register/vendor-onboarding');
  });

  it('routes a SELLER to the seller dashboard', () => {
    expect(getSellerEntryTarget('SELLER')).toBe('/seller/dashboard');
  });

  it('routes ADMIN / SUPER_ADMIN / MANAGER to their dashboards', () => {
    expect(getSellerEntryTarget('ADMIN')).toBe('/admin/dashboard');
    expect(getSellerEntryTarget('SUPER_ADMIN')).toBe('/admin/dashboard');
    expect(getSellerEntryTarget('MANAGER')).toBe('/seller/dashboard');
  });

  it('routes a VIEWER to the buyer dashboard', () => {
    expect(getSellerEntryTarget('VIEWER')).toBe('/buyer/dashboard');
  });

  it('routes a logged-out user to new-user vendor registration', () => {
    expect(getSellerEntryTarget('')).toBe('/register/vendor');
    expect(getSellerEntryTarget()).toBe('/register/vendor');
  });
});

describe('getGoLiveEntryTarget (R3B canonical entry)', () => {
  it('sends guests to the canonical /golive entry (which role-routes server-side)', () => {
    expect(getGoLiveEntryTarget('')).toBe('/golive');
  });

  it('matches getSellerEntryTarget for every authenticated role (single semantics)', () => {
    for (const role of ['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'VIEWER']) {
      expect(getGoLiveEntryTarget(role)).toBe(getSellerEntryTarget(role));
    }
  });
});

describe('resolvePostLoginTarget (MANAGER allowlist — F-16)', () => {
  it('honors a MANAGER seller-area next target (their home workspace)', () => {
    expect(resolvePostLoginTarget('MANAGER', '/seller/orders')).toBe('/seller/orders');
  });

  it('still blocks MANAGER targets outside the seller area', () => {
    expect(resolvePostLoginTarget('MANAGER', '/admin/users')).toBe('/seller/dashboard');
    expect(resolvePostLoginTarget('MANAGER', '/buyer/dashboard')).toBe('/seller/dashboard');
  });

  it('keeps the open-redirect guards intact for MANAGER', () => {
    expect(resolvePostLoginTarget('MANAGER', 'https://evil.example.com')).toBe('/seller/dashboard');
    expect(resolvePostLoginTarget('MANAGER', '//evil.example.com')).toBe('/seller/dashboard');
  });
});

describe('resolvePostLoginTarget', () => {
  it('returns the role dashboard when no next param is given', () => {
    expect(resolvePostLoginTarget('BUYER', null)).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', undefined)).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('SELLER', '')).toBe('/seller/dashboard');
  });

  it('honors buyer-safe destinations (buyer pages + seller upgrade wizard)', () => {
    expect(resolvePostLoginTarget('BUYER', '/buyer/orders')).toBe('/buyer/orders');
    expect(resolvePostLoginTarget('BUYER', '/register/vendor-onboarding')).toBe('/register/vendor-onboarding');
  });

  it('honors the canonical /golive entry (with plan hints) for buyer-class roles', () => {
    expect(resolvePostLoginTarget('BUYER', '/golive?planId=trade_smart&tier=B')).toBe(
      '/golive?planId=trade_smart&tier=B',
    );
    expect(resolvePostLoginTarget('VIEWER', '/golive')).toBe('/golive');
    expect(resolvePostLoginTarget('SELLER', '/golive')).toBe('/seller/dashboard');
    expect(resolvePostLoginTarget('BUYER', '/goliveX')).toBe('/buyer/dashboard');
  });

  it('honors the purchase return for buyer-class roles (TRAD UP free flow + paid plans)', () => {
    // Guest TRAD UP CTA lands here post-login; total===0 short-circuits to
    // activate-free with no gateway touch, so this is never a payment doorway.
    expect(resolvePostLoginTarget('BUYER', '/subscription/purchase?planId=trad-up')).toBe(
      '/subscription/purchase?planId=trad-up',
    );
    expect(resolvePostLoginTarget('VIEWER', '/subscription/purchase?planId=trade_smart&tier=B')).toBe(
      '/subscription/purchase?planId=trade_smart&tier=B',
    );
    expect(resolvePostLoginTarget('SELLER', '/subscription/purchase?planId=trad-up')).toBe(
      '/seller/dashboard',
    );
    expect(resolvePostLoginTarget('ADMIN', '/subscription/purchase?planId=trad-up')).toBe(
      '/admin/dashboard',
    );
    expect(resolvePostLoginTarget('BUYER', '/subscription/purchaseX')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', '/subscription')).toBe('/buyer/dashboard');
  });

  it('honors seller-safe destinations', () => {
    expect(resolvePostLoginTarget('SELLER', '/seller/products')).toBe('/seller/products');
  });

  it('honors admin-safe destinations for ADMIN and SUPER_ADMIN', () => {
    expect(resolvePostLoginTarget('ADMIN', '/admin/users')).toBe('/admin/users');
    expect(resolvePostLoginTarget('SUPER_ADMIN', '/admin/dashboard')).toBe('/admin/dashboard');
  });

  it('falls back to the dashboard when next targets another role area', () => {
    expect(resolvePostLoginTarget('BUYER', '/admin/users')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('SELLER', '/buyer/orders')).toBe('/seller/dashboard');
  });

  it('rejects absolute and protocol-relative next params (open-redirect guard)', () => {
    expect(resolvePostLoginTarget('BUYER', 'https://evil.example.com')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', 'http://evil.example.com')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', '//evil.example.com')).toBe('/buyer/dashboard');
  });

  it('rejects non-path next params', () => {
    expect(resolvePostLoginTarget('BUYER', 'admin/users')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', 'javascript:alert(1)')).toBe('/buyer/dashboard');
  });
});

describe('resolvePostLoginTarget (R6 product-card return targets)', () => {
  it('honors the Buy Now checkout return for buyer-class roles', () => {
    expect(resolvePostLoginTarget('BUYER', '/checkout?productId=prod-1&qty=50')).toBe(
      '/checkout?productId=prod-1&qty=50',
    );
    expect(resolvePostLoginTarget('VIEWER', '/checkout')).toBe('/checkout');
  });

  it('honors the product detail return for buyer-class roles (Chat CTA)', () => {
    expect(resolvePostLoginTarget('BUYER', '/products/steel-316-sheet')).toBe('/products/steel-316-sheet');
    expect(resolvePostLoginTarget('VIEWER', '/products/steel-316-sheet?mode=buy')).toBe(
      '/products/steel-316-sheet?mode=buy',
    );
  });

  it('keeps checkout and product returns off-limits for other roles', () => {
    expect(resolvePostLoginTarget('SELLER', '/checkout?productId=prod-1')).toBe('/seller/dashboard');
    expect(resolvePostLoginTarget('SELLER', '/products/steel-316-sheet')).toBe('/seller/dashboard');
    expect(resolvePostLoginTarget('ADMIN', '/checkout')).toBe('/admin/dashboard');
  });

  it('rejects checkout-prefix impostors (exact-path guard)', () => {
    expect(resolvePostLoginTarget('BUYER', '/checkoutX')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', '/checkout/extra')).toBe('/buyer/dashboard');
  });

  it('keeps the open-redirect guards intact for the new targets', () => {
    expect(resolvePostLoginTarget('BUYER', 'https://evil.example.com/checkout')).toBe('/buyer/dashboard');
    expect(resolvePostLoginTarget('BUYER', '//evil.example.com/products/x')).toBe('/buyer/dashboard');
  });
});