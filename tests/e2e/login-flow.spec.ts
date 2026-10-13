import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';
import { BUYER_USER, SELLER_USER } from '../helpers/auth';

test.describe('Login Flow', () => {
  test('should display login form with all fields', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/login');
    await expect(page.locator('input[autocomplete="username"]').first()).toBeVisible();
    await expect(page.locator('input[autocomplete="current-password"], input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    await context.close();
  });

  test('should show forgot password link', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('load');
    const forgotLink = page.locator('a[href*="forgot"]').first();
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show register link for new users', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('load');
    const registerLink = page.locator('a[href*="register"]').filter({ visible: true }).first();
    await expect(registerLink).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show error on invalid credentials', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Deterministic Turnstile: serve the same proven mock the turnstile test
    // uses, so the widget does not depend on the live Cloudflare script.
    await page.route('**/turnstile/v0/api.js', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile = { render: (el, opts) => { const f = document.createElement('iframe'); f.src = 'https://challenges.cloudflare.com/turnstile/v0/mock'; f.width = '300'; f.height = '65'; f.style.border = 'none'; el.appendChild(f); return 'mock-widget'; }, remove: () => {}, reset: () => {} };`,
      }),
    );
    const flow = createFlowHelper(page);
    await flow.navigate('/login');
    // Readiness FIRST: the Turnstile iframe is rendered by a client effect,
    // so its presence proves hydration completed and the submit handler is
    // attached. Fills below must land post-hydration — filling earlier can
    // write into pre-hydration SSR markup whose values React wipes on
    // hydrate (observed: username empty at submit on slow engines while the
    // later password fill survived). Same integration signal as the
    // turnstile test.
    await expect(page.locator('iframe[src*="challenges.cloudflare"]').first()).toBeVisible({ timeout: 10000 });
    await flow.fillField('input[autocomplete="username"]', 'invalid@test.com');
    await flow.fillField('input[autocomplete="current-password"], input[type="password"]', 'wrongpassword');
    // Value persistence: fail here with an explicit cause if hydration (or a
    // pane swap) wiped a fill, instead of burning the response timeout on a
    // submit that the client will silently skip for empty input.
    await expect(page.locator('input[autocomplete="username"]').first()).toHaveValue('invalid@test.com', { timeout: 10000 });
    await expect(page.locator('input[autocomplete="current-password"], input[type="password"]').first()).toHaveValue('wrongpassword', { timeout: 10000 });
    // Dispatch correlation: the response waiter starts BEFORE the click, so a
    // silent no-op submit fails here with an explicit cause instead of burning
    // the error-message timeout plus retries on a doomed assertion. Contract:
    // unknown identifier -> UnauthorizedException -> HTTP 401 (auth.service).
    const loginCall = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST',
      { timeout: 15000 },
    );
    await flow.clickButton('Sign In');
    await page.waitForTimeout(2000);
    const loginResp = await loginCall;
    expect(loginResp.status()).toBe(401);
    const errorMsg = page.getByText(/invalid|error|failed|incorrect|not found/i).first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have turnstile widget on login form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/turnstile/v0/api.js', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile = { render: (el, opts) => { const f = document.createElement('iframe'); f.src = 'https://challenges.cloudflare.com/turnstile/v0/mock'; f.width = '300'; f.height = '65'; f.style.border = 'none'; el.appendChild(f); return 'mock-widget'; }, remove: () => {}, reset: () => {} };`,
      }),
    );
    await page.goto('/login');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    const turnstile = page.locator('iframe[src*="challenges.cloudflare"]').first();
    await expect(turnstile).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should redirect authenticated user from login page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/login');
    await expect(page).not.toHaveURL(/\/login$/);
    await context.close();
  });

  test('should have social login options', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('load');
    const socialButtons = page.locator('button:has-text("Google"), button:has-text("LinkedIn")').first();
    await expect(socialButtons).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
