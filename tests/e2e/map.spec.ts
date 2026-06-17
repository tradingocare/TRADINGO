import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, BUYER_USER } from '../helpers/auth';

test.describe('Map Integration', () => {
  test('should render map container on desktop', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const mapEl = page.locator('.leaflet-container').first();
    await expect(mapEl).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('should render map controls (zoom, locate)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);
    const zoomIn = page.locator('.leaflet-control-zoom-in').first();
    const zoomOut = page.locator('.leaflet-control-zoom-out').first();
    await expect(zoomIn).toBeVisible({ timeout: 10000 });
    await expect(zoomOut).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have map toolbar with locate me', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const locateBtn = page.locator('button[aria-label="Use current location"]').first();
    await expect(locateBtn).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should have map legend with product count', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);
    const legend = page.locator('[role="status"]').first();
    await expect(legend).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('should show map legend with radius info', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);
    const radiusInfo = page.locator('text=Radius').first();
    await expect(radiusInfo).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should render product markers when products exist', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, geolocation: { latitude: 19.076, longitude: 72.8777 }, permissions: ['geolocation'] });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me?lat=19.076&lng=72.8777&radius=20000');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);
    const markers = page.locator('.custom-product-marker, .custom-product-marker-verified, .leaflet-marker-icon').first();
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    if (markerCount > 0) {
      await expect(markers).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });

  test('should toggle map visibility', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const mapToggle = page.locator('button:has-text("Hide Map")').first();
    if (await mapToggle.isVisible()) {
      await mapToggle.click();
      await page.waitForTimeout(500);
      const showToggle = page.locator('button:has-text("Show Map")').first();
      await expect(showToggle).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });

  test('should have map accessible role', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const mapRegion = page.locator('[aria-label="Product discovery map"]').first();
    await expect(mapRegion).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('should switch between mobile map and list view', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await page.goto('/buyer/near-me');
    await page.waitForLoadState('networkidle');

    const mapBtn = page.locator('button[aria-label="Show map view"]').first();
    const listBtn = page.locator('button[aria-label="Show list view"]').first();
    await expect(mapBtn).toBeVisible({ timeout: 10000 });
    await expect(listBtn).toBeVisible({ timeout: 10000 });

    if (await mapBtn.isVisible()) {
      await mapBtn.click();
      await page.waitForTimeout(500);
      const mapContainer = page.locator('.leaflet-container').first();
      await expect(mapContainer).toBeVisible({ timeout: 10000 });
    }
    await context.close();
  });
});
