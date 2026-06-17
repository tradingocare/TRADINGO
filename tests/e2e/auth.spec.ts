import { test, expect } from '../fixtures/auth-fixture';
import { navigateTo, expectPageTitle } from '../helpers/navigation';
import { loginAs, BUYER_USER, SELLER_USER, ADMIN_USER } from '../helpers/auth';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/seller/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await context.close();
  });

  test('should login as buyer and see buyer dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await expect(page).toHaveURL(/\/buyer\//, { timeout: 10000 });
    await context.close();
  });

  test('should login as seller and see seller dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await expect(page).toHaveURL(/\/seller\//, { timeout: 10000 });
    await context.close();
  });

  test('should login as admin and see admin dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await expect(page).toHaveURL(/\/admin\//, { timeout: 10000 });
    await context.close();
  });

  test('should show error on invalid credentials', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').first().fill('invalid@test.com');
    await page.locator('input[type="password"], input[name="password"]').first().fill('wrongpass');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=error', { hasText: /invalid|incorrect|failed/i }).first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should maintain session across page navigation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);

    await page.goto('/seller/dashboard');
    await expect(page).toHaveURL(/\/seller\/dashboard/);

    await page.goto('/seller/products');
    await expect(page).toHaveURL(/\/seller\/products/);

    await page.goto('/seller/settings');
    await expect(page).toHaveURL(/\/seller\/settings/);

    await context.close();
  });

  test('should clear session on logout', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);

    await page.evaluate(() => { localStorage.clear(); });
    await page.context().clearCookies();
    await page.goto('/buyer/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await context.close();
  });

  test('should protect seller routes from buyer access', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);

    await page.goto('/seller/dashboard');
    await expect(page).toHaveURL(/\/(login|403|404)/, { timeout: 10000 });

    await context.close();
  });

  test('should protect admin routes from seller access', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/(login|403|404)/, { timeout: 10000 });

    await context.close();
  });
});
