import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * Tier-B/C purchase journeys — browser UI half.
 *
 * Covers the implemented path from plan selection to the purchase gateway
 * entry, using only current source-traced selectors and destinations:
 *   /plans (package selector + commercial plan CTAs)
 *   → /subscription/purchase?planId=&tier= (plan/tier/duration context)
 *
 * Seller sessions are bootstrapped via the REAL register → onboarding APIs
 * (same contract as vendor-submit-api.spec.ts) with timestamp-unique
 * identities — no seeded roles are assumed, no localStorage role is faked,
 * no company state is inserted directly. The seed provides no SELLER-role
 * user, so a guest CTA can only ever reach vendor registration (asserted
 * as the specified guest branch, including planId/tier propagation).
 *
 * Stops before the Razorpay popup (external provider UI): gateway-order
 * creation and server amount contracts are covered in
 * tier-purchase-api.spec.ts; verification/activation paths are covered by
 * existing unit contract tests. No real-money execution anywhere.
 *
 * Requires the local E2E stack (web :3000 + API :3001 + seeded DB +
 * `npx playwright install`). No production dependency, no mocks.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const TS = Date.now();
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const SELLER = {
  email: `e2e-tier-buyer-${TS}@tradingo.com`,
  mobile: `9${String(TS).slice(-9)}`,
  password: 'TestTier@1234',
  pan: `TIERB${String(TS).slice(-4)}${LETTERS[TS % 23]}`,
};

function vendorPayload(email: string, pan: string, mobile: string) {
  return {
    businessName: `E2E Tier Buyer ${TS}`,
    businessType: 'private_limited',
    sellerType: 'manufacturer',
    yearEstablished: '2015',
    totalEmployees: '2-10',
    annualTurnover: '10L-50L',
    ownerName: 'E2E Tier Owner',
    designation: 'Owner',
    email,
    mobileNumber: mobile,
    password: SELLER.password,
    panNumber: pan,
    panHolderName: 'E2E Tier Owner',
    hasGst: false,
    description: 'E2E tier purchase bootstrap',
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
    accountHolderName: 'E2E Tier Owner',
    accountNumber: '123456789012',
    ifscCode: 'HDFC0001234',
    accountType: 'current',
  };
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  userRole: string;
}

let sellerSession: SessionTokens | null = null;

test.beforeAll(async ({ request }) => {
  // Bootstrap a real SELLER: register → onboard → use the issued tokens
  // directly (no /auth/login role-param guessing, no role faking).
  const api: APIRequestContext = request;
  // CSRF prehandler requires the Wassaf token + cookie pair on anonymous
  // POSTs (same contract as the web apiClient: GET /auth/csrf first).
  const csrfRes = await api.get(`${API_URL}/auth/csrf`);
  if (!csrfRes.ok()) throw new Error(`bootstrap csrf failed: ${csrfRes.status()}`);
  const csrfBody = await csrfRes.json();
  const csrfToken: string = (csrfBody.data || csrfBody).token;
  if (!csrfToken) throw new Error('bootstrap csrf failed: no token issued');
  const reg = await api.post(`${API_URL}/auth/register/vendor`, {
    headers: { 'x-csrf-token': csrfToken },
    data: vendorPayload(SELLER.email, SELLER.pan, SELLER.mobile),
  });
  if (!reg.ok()) throw new Error(`bootstrap register failed: ${reg.status()}`);
  const regBody = await reg.json();
  const regData = regBody.data || regBody;
  // Upgrade call must not carry a password (existing session authenticates).
  const onboardPayload: Record<string, unknown> = { ...vendorPayload(SELLER.email, SELLER.pan, SELLER.mobile) };
  delete onboardPayload.password;
  const onb = await api.post(`${API_URL}/auth/vendor/onboarding`, {
    headers: { Authorization: `Bearer ${regData.accessToken}` },
    data: onboardPayload,
  });
  if (!onb.ok()) throw new Error(`bootstrap onboarding failed: ${onb.status()}`);
  const onbBody = await onb.json();
  const onbData = onbBody.data || onbBody;
  sellerSession = {
    accessToken: onbData.accessToken,
    refreshToken: onbData.refreshToken,
    userRole: 'SELLER',
  };
});

// Same session-injection mechanics as tests/helpers/auth loginAs
// (context cookies + localStorage bridge), fed with real issued tokens.
async function loginWithToken(page: Page, auth: SessionTokens) {
  await page.context().addCookies([
    { name: 'accessToken', value: auth.accessToken, url: 'http://localhost:3000', sameSite: 'Lax' },
    { name: 'userRole', value: auth.userRole, url: 'http://localhost:3000', sameSite: 'Lax' },
  ]);
  await page.addInitScript((a: SessionTokens) => {
    localStorage.setItem('accessToken', a.accessToken);
    localStorage.setItem('refreshToken', a.refreshToken);
    localStorage.setItem('userRole', a.userRole);
    document.cookie = `userRole=${a.userRole}; path=/; max-age=86400; SameSite=Lax`;
  }, auth);
  await page.goto('/seller/dashboard');
  await page.waitForLoadState('load');
  const got = await page.evaluate(() => localStorage.getItem('accessToken') ?? '');
  if (!got) throw new Error('token injection failed: no accessToken after dashboard navigation');
}

test.describe('Tier-B/C purchase journeys (browser)', () => {
  test('Tier-B guest CTA carries planId and tier to vendor registration', async ({ page }) => {
    await page.goto('/plans');
    await page.waitForLoadState('load');
    await expect(page.getByText('Commercial Plans')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /PLAN B/ }).click();
    await expect(page.getByRole('button', { name: /PLAN B/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Choose Trade Smart/ }).click();
    // Guest branch: direct vendor entry with plan context (no login detour).
    await expect(page).toHaveURL(/\/register\/vendor\?planId=trade_smart&tier=B/, { timeout: 15000 });
  });

  test('Tier-C guest CTA carries planId and tier to vendor registration', async ({ page }) => {
    await page.goto('/plans');
    await page.waitForLoadState('load');
    await expect(page.getByText('Commercial Plans')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /PLAN C/ }).click();
    await expect(page.getByRole('button', { name: /PLAN C/ }).first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Choose Trade Plus/ }).click();
    await expect(page).toHaveURL(/\/register\/vendor\?planId=trade_plus&tier=C/, { timeout: 15000 });
  });

  test('Tier-B seller reaches the purchase page with 2-year context', async ({ page }) => {
    if (!sellerSession) throw new Error('seller bootstrap session missing');
    await loginWithToken(page, sellerSession);
    await page.goto('/plans');
    await page.waitForLoadState('load');
    await expect(page.getByText('Commercial Plans')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /PLAN B/ }).click();
    // Exact CTA text: Choose {name} — {₹ annual-tier price}, formatPrice en-IN.
    await page.getByRole('button', { name: 'Choose Trade Smart — ₹18,000', exact: true }).click();
    await expect(page).toHaveURL(/\/subscription\/purchase\?planId=trade_smart&tier=B/, { timeout: 15000 });

    await expect(page.getByText('Confirm & Proceed')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/2 Years/)).toBeVisible();
    await expect(page.getByText('Total Amount')).toBeVisible();
    await expect(page.getByText(/₹[\d,]+/).first()).toBeVisible();
  });

  test('Tier-C seller reaches the purchase page with 3-year context', async ({ page }) => {
    if (!sellerSession) throw new Error('seller bootstrap session missing');
    await loginWithToken(page, sellerSession);
    await page.goto('/plans');
    await page.waitForLoadState('load');
    await expect(page.getByText('Commercial Plans')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /PLAN C/ }).click();
    await page.getByRole('button', { name: 'Choose Trade Plus — ₹50,000', exact: true }).click();
    await expect(page).toHaveURL(/\/subscription\/purchase\?planId=trade_plus&tier=C/, { timeout: 15000 });

    await expect(page.getByText('Confirm & Proceed')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/3 Years/)).toBeVisible();
    await expect(page.getByText('Total Amount')).toBeVisible();
  });
});
