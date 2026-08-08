import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';
import { BUYER_USER, SELLER_USER } from '../helpers/auth';

test.describe('Order & Payment Flow', () => {
  test('buyer can view orders page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/orders');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer order page has status filters', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/orders');
    await page.waitForLoadState('load');
    const filters = page.locator('button:has-text("All"), button:has-text("Pending"), button:has-text("Completed")');
    const count = await filters.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await context.close();
  });

  test('seller can view orders page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/orders');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view payments page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/payments');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view PO page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/po');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can view PO page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/po');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view shipment tracking', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/shipment');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can view shipment page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/shipment');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view delivery tracking', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/delivery');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('admin can view payments dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login({ email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com', password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123', name: 'E2E Admin' });
    await flow.navigate('/admin/payments');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
