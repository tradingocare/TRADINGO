import { test, expect, request, APIRequestContext } from '@playwright/test';

/**
 * Vendor wizard submission journey — server-submit half (P2).
 *
 * Exercises the REAL submit path the wizard calls, with zero mocks and full
 * server validation: POST /auth/register/vendor (format + uniqueness +
 * password rules) then POST /auth/vendor/onboarding (company creation +
 * SELLER role + fresh session). The backend checks format/uniqueness only —
 * no verified-PAN/email flags exist server-side — so this file runs WITHOUT
 * verification provider credentials. The browser-side verification gates
 * (email OTP, PAN verified:true) are covered up to their specified block in
 * vendor-wizard-submit.spec.ts; the UI click-through past them requires
 * provider credentials and is recorded there as a gap, never faked here.
 *
 * Safety: unique-per-run identity (timestamp-derived email/PAN/mobile);
 * conflict probes reuse SEEDED identities (pre-existing rows) and fail
 * pre-write inside transactions — seed data is never mutated or destroyed.
 *
 * Requires the local E2E stack (API :3001 + seeded DB). No browser needed
 * beyond the Playwright runner itself.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const TS = Date.now();
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const EMAIL = `e2e-vendor-${TS}@tradingo.com`;
const PAN = `VNDOR${String(TS).slice(-4)}${LETTERS[TS % 23]}`;
const MOBILE = `9${String(TS).slice(-9)}`;

// Seeded identities (tests/helpers/e2e-seed.ts) — reused for conflict probes
// that must fail BEFORE any write. Never modified by this file.
const SEED_SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com';
const SEED_SELLER_PAN = 'AABCE1234E';

function vendorPayload(overrides: Record<string, unknown> = {}) {
  return {
    businessName: `E2E Vendor ${TS}`,
    businessType: 'private_limited',
    sellerType: 'manufacturer',
    yearEstablished: '2015',
    totalEmployees: '2-10',
    annualTurnover: '10L-50L',
    ownerName: 'E2E Vendor Owner',
    designation: 'Owner',
    email: EMAIL,
    mobileNumber: MOBILE,
    password: 'TestVend@1234',
    panNumber: PAN,
    panHolderName: 'E2E Vendor Owner',
    hasGst: false,
    description: 'E2E test vendor registration',
    primaryCategory: 'Test Category',
    productTypes: 'Test Products',
    moqRange: '1-100',
    supplyCapacity: '1000 units',
    leadTime: '7 days',
    exportCapability: false,
    addressLine1: '12 Test Street',
    city: 'Mumbai',
    district: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    accountHolderName: 'E2E Vendor Owner',
    accountNumber: '123456789012',
    ifscCode: 'HDFC0001234',
    accountType: 'current',
    ...overrides,
  };
}

let api: APIRequestContext;
let registerToken = '';
let sellerToken = '';

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: API_URL });
});

test.afterAll(async () => {
  await api.dispose();
});

test.describe('Vendor submit API (live server validation)', () => {
  test('register creates the account and issues a session', async () => {
    const res = await api.post('/auth/register/vendor', { data: vendorPayload() });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const data = body.data || body;
    expect(data.success).toBe(true);
    expect(typeof data.userId).toBe('string');
    expect(typeof data.accessToken).toBe('string');
    registerToken = data.accessToken;
  });

  test('onboarding creates the company and flips the role to SELLER', async () => {
    const res = await api.post('/auth/vendor/onboarding', {
      headers: { Authorization: `Bearer ${registerToken}` },
      // Password must not travel on the upgrade call (existing session).
      data: { ...vendorPayload(), password: undefined },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const data = body.data || body;
    expect(data.success).toBe(true);
    expect(typeof data.companyId).toBe('string');
    expect(typeof data.accessToken).toBe('string');
    sellerToken = data.accessToken;
  });

  test('session carries the SELLER role (P1 seller-shell guard passes)', async () => {
    const res = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    expect(data.user?.role).toBe('SELLER');
  });

  test('duplicate email is rejected without mutation', async () => {
    const res = await api.post('/auth/register/vendor', {
      data: vendorPayload({ email: SEED_SELLER_EMAIL }),
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(JSON.stringify(body)).toMatch(/already registered/i);
  });

  test('duplicate PAN is rejected without mutation', async () => {
    const res = await api.post('/auth/register/vendor', {
      data: vendorPayload({ panNumber: SEED_SELLER_PAN }),
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(JSON.stringify(body)).toMatch(/PAN.*registered/i);
  });

  test('malformed PAN is rejected', async () => {
    const res = await api.post('/auth/register/vendor', {
      data: vendorPayload({ panNumber: 'ABC123' }),
    });
    expect(res.status()).toBe(400);
  });

  test('missing password is rejected for new vendors', async () => {
    const payload = vendorPayload() as Record<string, unknown>;
    delete payload.password;
    const res = await api.post('/auth/register/vendor', { data: payload });
    expect(res.status()).toBe(400);
  });

  test('re-onboarding an active seller is rejected', async () => {
    const res = await api.post('/auth/vendor/onboarding', {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { ...vendorPayload(), password: undefined },
    });
    expect(res.status()).toBe(409);
  });
});
