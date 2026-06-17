import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, BUYER_USER, SELLER_USER, ADMIN_USER } from '../helpers/auth';

test.describe('Accessibility', () => {
  test('near-me page should have proper heading hierarchy', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    await expect(h1).toContainText('Near Me');
    await context.close();
  });

  test('map should have accessible role and label', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const mapRegion = page.locator('[aria-label="Product discovery map"]').first();
    await expect(mapRegion).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('map toolbar buttons should have aria-labels', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const locateBtn = page.locator('button[aria-label="Use current location"]').first();
    await expect(locateBtn).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller products page should have proper heading hierarchy', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products');
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('admin templates page should have proper heading hierarchy', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/category-templates');
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('product popup should have accessible label', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me?lat=19.076&lng=72.8777&radius=20000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();
    if (count > 0) {
      await markers.first().click();
      await page.waitForTimeout(1000);
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });
});
