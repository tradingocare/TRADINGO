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
    await expect(page.locator('input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"]').first()).toBeVisible();
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
    await flow.clickButton('Create Account');
    await page.waitForTimeout(1000);
    const errors = page.locator('text=required, text=invalid, text=Please');
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
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible();
    await context.close();
  });

  test('should show turnstile widget on register form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/register/buyer');
    await page.waitForLoadState('networkidle');
    const turnstile = page.locator('[class*="turnstile"], iframe[src*="challenges.cloudflare"]').first();
    await expect(turnstile).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
