import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';

test.describe('Registration Flow', () => {
  test('should display buyer registration form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/register/buyer');
    await flow.expectHeading('Register');
    await expect(page.locator('input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"]').first()).toBeVisible();
    await expect(page.locator('input[name="name"]').first()).toBeVisible();
    await context.close();
  });

  test('should display vendor registration form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/register/vendor');
    await flow.expectHeading('Register');
    await expect(page.locator('input').first()).toBeVisible();
    await expect(page.locator('input').nth(1)).toBeVisible();
    await context.close();
  });

  test('should display seller registration page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/register/seller');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await context.close();
  });

  test('should show validation errors on empty form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/register/buyer');
    const continueBtn = page.locator('button:has-text("Continue")').first();
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(1000);
    const errors = page.getByText(/required|invalid|Please/i);
    const count = await errors.count();
    expect(count).toBeGreaterThan(0);
    await context.close();
  });

  test('should navigate between registration options', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/register');
    const buyerLink = page.locator('a[href*="buyer"], a:has-text("Buyer")').first();
    const sellerLink = page.locator('a[href*="seller"], a:has-text("Seller")').first();
    await expect(buyerLink).toBeVisible();
    await expect(sellerLink).toBeVisible();
    await context.close();
  });

  test('should have link to login for existing users', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/register/buyer');
    const loginLink = page.locator('a[href*="login"]').filter({ visible: true }).first();
    await expect(loginLink).toBeVisible();
    await context.close();
  });

  test('should show turnstile widget on register form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/turnstile/v0/api.js', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile = { render: (el, opts) => { const f = document.createElement('iframe'); f.src = 'https://challenges.cloudflare.com/turnstile/v0/mock'; f.width = '300'; f.height = '65'; f.style.border = 'none'; el.appendChild(f); return 'mock-widget'; }, remove: () => {}, reset: () => {} };`,
      }),
    );
    await page.goto('/register');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    const turnstile = page.locator('iframe[src*="challenges.cloudflare"]').first();
    await expect(turnstile).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
