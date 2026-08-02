import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';
import { SELLER_USER, BUYER_USER } from '../helpers/auth';

test.describe('Product Listing Flow', () => {
  test('seller products page loads with list', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller products page has add product button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/products');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('a[href*="new"], a:has-text("Add Product"), button:has-text("Add Product")').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can navigate to new product wizard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/products/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('new product wizard has step navigation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/products/new');
    await page.waitForLoadState('networkidle');
    const stepIndicator = page.locator('[class*="step"], [aria-label*="step"], [role="progressbar"]').first();
    await expect(stepIndicator).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer marketplace shows products', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/browse');
    await page.waitForLoadState('networkidle');
    const productsSection = page.locator('[class*="product"], [class*="card"]').first();
    await expect(productsSection).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can search products', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/browse?search=test');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/search=test/);
    await context.close();
  });

  test('buyer can view product categories', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
