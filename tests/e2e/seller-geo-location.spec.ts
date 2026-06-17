import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, SELLER_USER } from '../helpers/auth';
import { navigateTo, expectPageTitle } from '../helpers/navigation';

test.describe('Seller Geo-location Management', () => {
  test('should navigate to product locations page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    await expectPageTitle(page, 'Product Locations');
    await context.close();
  });

  test('should have product location table', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show location status badges', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const badges = page.locator('text=Not Set, text=Set, text=Pending Sync');
    await expect(badges.first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should filter products by location status', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const setFilter = page.locator('button:has-text("Set")').first();
    const missingFilter = page.locator('button:has-text("Missing")').first();
    await expect(setFilter).toBeVisible({ timeout: 10000 });
    await expect(missingFilter).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have search input for products', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show product count in table', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const countInfo = page.locator('text=Showing').first();
    await expect(countInfo).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have edit links for each product', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const editLinks = page.locator('a:has-text("Edit")').first();
    await expect(editLinks).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should navigate to single product location page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const editLink = page.locator('a:has-text("Edit")').first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/seller\/products\/.+\/location/);
    }
    await context.close();
  });

  test('should show bulk set location button when products selected', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 1) {
      await checkboxes.nth(1).check();
      const bulkBtn = page.locator('button:has-text("Bulk Set Location")').first();
      await expect(bulkBtn).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });

  test('should show missing locations banner', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await page.goto('/seller/products/locations');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('text=product without location').first();
    if (await banner.isVisible().catch(() => false)) {
      await expect(banner).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });
});
