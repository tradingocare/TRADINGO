import { test, expect, Page } from '@playwright/test';

/**
 * Vendor wizard submission journey — browser UI half (P2).
 *
 * Covers the real implemented journey as far as it can go WITHOUT external
 * verification credentials: entry, Step 1 (validation + fill + persistence),
 * Step 2 (field validation + the specified email-verification gate).
 *
 * HARD BOUNDARY (evidenced, not assumed): Step 2 Next is blocked until
 * `emailVerified` (Step2ContactCredentials:97) and Step 3 Next until PAN
 * `verified:true` (Step3PANVerification:103). Email OTP delivery needs a
 * configured mail sender and PAN verification needs provider credentials
 * (PAN_VERIFY_API_URL/KEY); the repo contains no test double for either
 * (auth.service verifyPan/verifyGst are direct config-gated HTTP calls).
 * Steps 3–7 UI and the submit click are therefore unreachable in a
 * credential-less environment — recorded as a gap, never faked.
 * The server-side submit path (which validates format/uniqueness only)
 * is covered separately in vendor-submit-api.spec.ts.
 *
 * Requires the local E2E stack (web :3000 + API :3001 + seeded DB +
 * `npx playwright install`). No production dependency, no mocks, no seeded
 * data mutation (no submit is ever performed by this file).
 */

const TS = Date.now();
const VENDOR = {
  businessName: `E2E Vendor ${TS}`,
  email: `e2e.vendor.${TS}@gmail.com`,
  mobile: `9${String(TS).slice(-9)}`,
  password: 'TestVend@1234',
  owner: 'E2E Vendor Owner',
};

async function fillStep1(page: Page) {
  await page.getByPlaceholder('e.g. Kumar Enterprises').fill(VENDOR.businessName);
  await page.getByRole('button', { name: /Private Limited/ }).click();
  await page.getByRole('button', { name: /Manufacturer/ }).click();
  const selects = page.locator('select');
  await selects.nth(0).selectOption({ index: 1 }); // Year Established
  await selects.nth(1).selectOption({ label: '2-10' }); // Total Employees
  await selects.nth(2).selectOption({ label: '10L-50L' }); // Annual Turnover
  await page.getByRole('button', { name: /Continue/ }).click();
  // Wait for Step 2 header - use longer timeout for mobile stability
  await expect(page.getByText('Contact & Login')).toBeVisible({ timeout: 30000 });
}

test.describe('Vendor wizard submission journey (UI)', () => {
  test('entry loads the vendor registration at Step 1', async ({ page }) => {
    await page.goto('/register/vendor');
    await page.waitForLoadState('load');
    await expect(page.getByText('Seller Registration').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Business Identity')).toBeVisible({ timeout: 20000 });
  });

  test('Step 1 validation blocks empty submission', async ({ page }) => {
    await page.goto('/register/vendor');
    await page.waitForLoadState('load');
    await expect(page.getByText('Business Identity')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByText('Business name is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Select a business type')).toBeVisible();
    await expect(page.getByText('Business Identity')).toBeVisible();
  });

test('Step 1 values survive Back navigation', async ({ page }) => {
    await page.goto('/register/vendor');
    await page.waitForLoadState('load');
    await expect(page.getByText('Business Identity')).toBeVisible({ timeout: 20000 });
    await fillStep1(page);

    await page.getByRole('button', { name: /Back/ }).click();
    // After clicking Back from Step 2, we should be back at Step 1
    await expect(page.getByText('Business Identity')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('e.g. Kumar Enterprises')).toHaveValue(VENDOR.businessName);
  });

  test('Step 2 validates email shape and disposable domains', async ({ page }) => {
    await page.goto('/register/vendor');
    await page.waitForLoadState('load');
    await expect(page.getByText('Business Identity')).toBeVisible({ timeout: 20000 });
    await fillStep1(page);

    // Invalid email format
    await page.getByPlaceholder('you@company.com').fill('not-an-email');
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByText('Enter a valid email').first()).toBeVisible({ timeout: 10000 });

    // Disposable email - validation is reactive, blur to ensure it triggers
    await page.getByPlaceholder('you@company.com').fill('test@mailinator.com');
    await page.getByPlaceholder('you@company.com').blur();
    await expect(page.getByText('Disposable email addresses are not allowed').first()).toBeVisible({ timeout: 10000 });
  });

  test('Step 2 blocks progression until the email is verified', async ({ page }) => {
    await page.goto('/register/vendor');
    await page.waitForLoadState('load');
    await expect(page.getByText('Business Identity')).toBeVisible({ timeout: 20000 });
    await fillStep1(page);

    await page.getByPlaceholder('Full name').fill(VENDOR.owner);
    await page.getByLabel('Designation').selectOption({ index: 1 });
    await page.getByPlaceholder('9876543210').fill(VENDOR.mobile);
    await page.getByPlaceholder('you@company.com').fill(VENDOR.email);
    await page.getByPlaceholder('Min 8 characters').fill(VENDOR.password);
    await page.getByPlaceholder('Re-enter password').fill(VENDOR.password);

    // The specified gate: without a verified email OTP the wizard must not
    // advance, and the reason must be stated (no silent block). The step
    // renders that reason twice (summary <li> + field-level <p>), so the
    // locator must be narrowed — an unscoped getByText is a strict-mode
    // violation, not a missing gate.
    await page.getByRole('button', { name: /Continue/ }).click();
    await expect(page.getByText('Email must be verified').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Contact & Login')).toBeVisible();
  });
});
