import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';
import { BUYER_USER, SELLER_USER } from '../helpers/auth';

test.describe('RFQ & Quote Flow', () => {
  test('buyer can see RFQ list page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/rfq');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can access create RFQ page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/rfq/new');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('create RFQ form has required fields', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/rfq/new');
    await page.waitForLoadState('load');
    const formFields = page.locator('input, textarea, select');
    const count = await formFields.count();
    expect(count).toBeGreaterThan(0);
    await context.close();
  });

  test('buyer can access saved RFQs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/rfqs');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can view incoming RFQs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/rfqs');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can access quote creation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/quote/new');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view quote comparison page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/quote/compare');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller can view their quotes', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/quotes');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('buyer can view their quotes', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(BUYER_USER);
    await flow.navigate('/buyer/quotes');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
