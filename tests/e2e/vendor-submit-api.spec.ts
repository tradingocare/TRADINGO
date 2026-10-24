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
 * beyond the Playwright runner itself. As in CI (`E2E_THROTTLE_DISABLED=true`
 * on the API start step), the per-route throttle must be disabled for a
 * credential-less local run: /auth/register/vendor is limited to 3/min and
 * this file issues 5 such probes.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
// The APIRequestContext below is built with `baseURL: API_URL`, and Playwright
// resolves a leading-slash path with `new URL(path, baseURL)` — which replaces
// the base URL's path. '/auth/csrf' therefore lands on :3001/auth/csrf, NOT
// :3001/api/v1/auth/csrf (proven: that request 404s). Every path below carries
// the full '/api/v1' prefix, exactly as tests/e2e/tier-purchase-api.spec.ts does.
const API_PREFIX = '/api/v1';
const TS = Date.now();
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const EMAIL = `e2e-vendor-${TS}@tradingo.com`;
const PAN = `VNDOR${String(TS).slice(-4)}${LETTERS[TS % 23]}`;
const MOBILE = `9${String(TS).slice(-9)}`;

// Seeded identities (tests/helpers/e2e-seed.ts) — reused for conflict probes
// that must fail BEFORE any write. Never modified by this file.
const SEED_SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com';
const SEED_SELLER_PAN = 'AABCE1234E';
// The onboarding DTO resolves `primaryCategory` through the canonical taxonomy
// resolver and is fail-closed (auth.service.linkCompanyCategories): an
// unresolvable name rejects the whole registration with 400 "Unknown business
// category". 'PCB Components' is the category tests/helpers/e2e-seed.ts plants
// in BOTH the catalog taxonomy and the legacy Category table — i.e. the same
// list the wizard's category picker is fed from.
const SEED_CATEGORY = 'PCB Components';

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
    primaryCategory: SEED_CATEGORY,
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

/**
 * Negative probes must vary exactly ONE already-taken field against an
 * otherwise fresh identity. Reusing the golden-path email/PAN/mobile in a
 * second probe leaves two conflicts in play and the answer becomes the
 * server's first hit, not the rule under test — observed before this helper:
 * the PAN probe carried the already-registered email, failed its message
 * assertion on the first attempt, and the retry's worker restart (which
 * replays beforeAll but not the earlier tests) then broke the later
 * session-dependent test with a 401.
 */
let identitySeq = 0;
function isolatedVendor(overrides: Record<string, unknown> = {}) {
  identitySeq += 1;
  const n = TS + identitySeq;
  return vendorPayload({
    email: `e2e-vendor-${n}@tradingo.com`,
    panNumber: `VNDOR${String(n).slice(-4)}${LETTERS[n % 23]}`,
    mobileNumber: `9${String(n).slice(-9)}`,
    ...overrides,
  });
}

let api: APIRequestContext;
let registerToken = '';
let sellerToken = '';
let csrfToken = '';

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: API_URL });
  // The anonymous CSRF preHandler rejects every state-changing request that
  // carries neither a trusted Origin nor an Authorization header with
  // 403 "Missing csrf secret" — a browser supplies Origin automatically, an
  // APIRequestContext does not. Satisfy the same contract the web apiClient
  // uses: GET /auth/csrf first, then echo the token pair on each POST
  // (identical bootstrap to tests/e2e/tier-purchase.spec.ts).
  const csrfRes = await api.get(`${API_PREFIX}/auth/csrf`);
  if (!csrfRes.ok()) throw new Error(`bootstrap csrf failed: ${csrfRes.status()}`);
  const csrfBody = await csrfRes.json();
  csrfToken = (csrfBody.data || csrfBody).token;
  if (!csrfToken) throw new Error('bootstrap csrf failed: no token issued');
});

/** Anonymous POST /auth/register/vendor — carries the CSRF token+cookie pair. */
function registerVendor(data: Record<string, unknown>) {
  return api.post(`${API_PREFIX}/auth/register/vendor`, {
    headers: { 'x-csrf-token': csrfToken },
    data,
  });
}

test.afterAll(async () => {
  await api.dispose();
});

test.describe('Vendor submit API (live server validation)', () => {
  test('register creates the account and issues a session', async () => {
    const res = await registerVendor(vendorPayload());
    expect(res.status()).toBe(201);
    const body = await res.json();
    const data = body.data || body;
    expect(data.success).toBe(true);
    expect(typeof data.userId).toBe('string');
    expect(typeof data.accessToken).toBe('string');
    registerToken = data.accessToken;
  });

  test('onboarding creates the company and flips the role to SELLER', async () => {
    const res = await api.post(`${API_PREFIX}/auth/vendor/onboarding`, {
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
    const res = await api.get(`${API_PREFIX}/users/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    // GET /users/me returns the profile object itself at `data` (verified live:
    // {data:{id,email,name,role:'SELLER',...}}). Tolerate the legacy nested
    // `data.user` shape exactly as tests/helpers/global-setup.ts does.
    const profile = data.user || data;
    expect(profile.role).toBe('SELLER');
  });

  test('duplicate email is rejected without mutation', async () => {
    const res = await registerVendor(isolatedVendor({ email: SEED_SELLER_EMAIL }));
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(JSON.stringify(body)).toMatch(/already registered/i);
  });

  test('duplicate PAN is rejected without mutation', async () => {
    const res = await registerVendor(isolatedVendor({ panNumber: SEED_SELLER_PAN }));
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(JSON.stringify(body)).toMatch(/PAN.*registered/i);
  });

  test('malformed PAN is rejected', async () => {
    const res = await registerVendor(isolatedVendor({ panNumber: 'ABC123' }));
    expect(res.status()).toBe(400);
  });

  test('missing password is rejected for new vendors', async () => {
    const payload = isolatedVendor() as Record<string, unknown>;
    delete payload.password;
    const res = await registerVendor(payload);
    expect(res.status()).toBe(400);
  });

  test('re-onboarding an active seller is rejected', async () => {
    const res = await api.post(`${API_PREFIX}/auth/vendor/onboarding`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { ...vendorPayload(), password: undefined },
    });
    expect(res.status()).toBe(409);
  });
});
