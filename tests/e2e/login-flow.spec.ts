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
    await page.waitForLoadState('networkidle');
    const forgotLink = page.locator('a[href*="forgot"]').first();
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show register link for new users', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const registerLink = page.locator('a[href*="register"]').first();
    await expect(registerLink).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show error on invalid credentials', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.navigate('/login');
    await flow.fillField('input[autocomplete="username"]', 'invalid@test.com');
    await flow.fillField('input[autocomplete="current-password"], input[type="password"]', 'wrongpassword');
    await flow.clickButton('Sign In');
    await page.waitForTimeout(2000);
    const errorMsg = page.locator('text=invalid, text=error, text=failed, text=incorrect, text=not found').first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have turnstile widget on login form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const turnstile = page.locator('[class*="turnstile"], iframe[src*="challenges.cloudflare"]').first();
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
    await page.waitForLoadState('networkidle');
    const socialButtons = page.locator('button:has-text("Google"), button:has-text("LinkedIn")').first();
    await expect(socialButtons).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
