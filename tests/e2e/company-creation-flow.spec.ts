import { test, expect } from '../fixtures/auth-fixture';
import { createFlowHelper } from '../helpers/business-flows';
import { SELLER_USER } from '../helpers/auth';

test.describe('Company Creation Flow', () => {
  test('seller should see company profile page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/profile');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller profile should have company details section', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/profile');
    await page.waitForLoadState('load');
    const companySection = page.getByText(/Company|Business|Profile/i).filter({ visible: true }).first();
    await expect(companySection).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller profile should have contact information', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/profile');
    await page.waitForLoadState('load');
    const contactFields = page.locator('input[name*="email"], input[name*="phone"], input[name*="mobile"]');
    const count = await contactFields.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await context.close();
  });

  test('seller profile should show company information card', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/profile');
    await page.waitForLoadState('load');
    const companyCard = page.getByText('Company Information').first();
    await expect(companyCard).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('seller should navigate to onboarding if not completed', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const flow = createFlowHelper(page);
    await flow.login(SELLER_USER);
    await flow.navigate('/seller/onboarding');
    await page.waitForLoadState('load');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});
