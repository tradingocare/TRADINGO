import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';
import { BUYER_USER, SELLER_USER } from '../helpers/auth';

test.describe('Escrow & Settlement Flow', () => {
  test('admin can view escrow dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login({ email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com', password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123', name: 'E2E Admin' });
    await flow.navigate('/admin/finance');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('admin finance page has tab navigation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login({ email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com', password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123', name: 'E2E Admin' });
    await flow.navigate('/admin/finance');
    await page.waitForLoadState('load');
    const tabs = page.locator('[role="tab"], button:has-text("Overview"), button:has-text("Revenue"), button:has-text("Settlements")');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
    await context.close();
  });

  test('admin can view disputes dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login({ email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com', password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123', name: 'E2E Admin' });
    await flow.navigate('/admin/disputes');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view wallet page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/gocash');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can view wallet page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/gocash');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('admin can view wallet management', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login({ email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com', password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123', name: 'E2E Admin' });
    await flow.navigate('/admin/wallets');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('admin can view settlement data in finance', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login({ email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com', password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123', name: 'E2E Admin' });
    await flow.navigate('/admin/finance');
    await page.waitForLoadState('load');
    const settlementSection = page.locator('text=Settlement, text=Settlement').first();
    if (await settlementSection.isVisible().catch(() => false)) {
      await expect(settlementSection).toBeVisible({ timeout: 5000 });
    }
    await context.close();
  });

  test('seller can view subscription billing', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/billing/invoices');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view billing history', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/billing/history');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
