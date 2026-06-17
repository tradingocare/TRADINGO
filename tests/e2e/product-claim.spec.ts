import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, SELLER_USER } from '../helpers/auth';

test.describe('Product Claim Flow', () => {
  test('should navigate to claim page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/claim');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toContainText('Claim', { timeout: 10000 });
    await context.close();
  });

  test('should navigate to product claims list page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/product-claims');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toContainText('Claims', { timeout: 10000 });
    await context.close();
  });

  test('should have claim form fields', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/claim');
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('form input, form textarea, form select').first();
    await expect(inputs).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
