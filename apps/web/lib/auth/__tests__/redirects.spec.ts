import { getSellerEntryTarget } from '../redirects';

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