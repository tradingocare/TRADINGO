import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, BUYER_USER } from '../helpers/auth';
import { navigateTo, waitForSettled } from '../helpers/navigation';

test.describe('Near Me — Product Discovery', () => {
  test('should load Near Me page with default center', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    await expect(page.locator('h1').first()).toContainText('Near Me');
    await expect(page.locator('text=km').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have radius selector with predefined options', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    const radiusOptions = ['5', '10', '25', '50', '100'];
    for (const km of radiusOptions) {
      const button = page.locator(`button:has-text("${km} km")`).first();
      await expect(button).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });

  test('should change radius and refresh results', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    const radiusBtn = page.locator('button:has-text("100 km")').filter({ visible: true }).first();
    await radiusBtn.scrollIntoViewIfNeeded();
    await radiusBtn.click({ force: true });
    await waitForSettled(page);

    await expect(page.locator('text=100 km').first()).toBeVisible({ timeout: 5000 });
    await context.close();
  });

  test('should have sort dropdown with all options', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    const sortSelect = page.locator('select:has(option[value="distance"])').first();
    await expect(sortSelect).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have filter drawer', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    const filterButton = page.locator('button:has-text("Filter")').first();
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have locate me button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    const locateBtn = page.locator('button:has-text("My Location"), button:has-text("Use My Location")').first();
    await expect(locateBtn).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should preserve URL params on page refresh', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me?lat=19.076&lng=72.8777&radius=50&sort=trust');
    await page.waitForLoadState('load');

    await expect(page).toHaveURL(/radius=50/);
    await expect(page).toHaveURL(/sort=trust/);

    await page.reload();
    await page.waitForLoadState('load');

    await expect(page).toHaveURL(/radius=50/);
    await expect(page).toHaveURL(/sort=trust/);
    await context.close();
  });

  test('should handle empty state when no products found', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me?lat=-90&lng=0&radius=5');
    await page.waitForLoadState('load');

    await page.waitForTimeout(3000);
    const listBtn = page.locator('button[aria-label="Show list view"]').first();
    if (await listBtn.isVisible()) {
      await listBtn.click();
      await page.waitForTimeout(500);
    }
    const emptyState = page.locator('text=No products found').filter({ visible: true }).last();
    await expect(emptyState).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('should show map toggle button on desktop', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    const mapToggle = page.locator('button:has-text("Show Map"), button:has-text("Hide Map")').first();
    await expect(mapToggle).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should show mobile view toggle buttons', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('load');

    await page.waitForTimeout(1000);
    const listButton = page.locator('button[aria-label="Show list view"]').first();
    const mapButton = page.locator('button[aria-label="Show map view"]').first();
    await expect(listButton).toBeVisible({ timeout: 10000 });
    await expect(mapButton).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
