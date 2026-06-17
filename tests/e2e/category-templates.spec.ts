import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, ADMIN_USER } from '../helpers/auth';

test.describe('Category Templates (Admin)', () => {
  test('should navigate to category templates page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/category-templates');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toContainText('Template', { timeout: 10000 });
    await context.close();
  });

  test('should have new template button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/category-templates');
    await page.waitForLoadState('networkidle');
    const newBtn = page.locator('a[href*="/admin/category-templates/new"], button:has-text("New Template")').first();
    await expect(newBtn).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('should navigate to new template form', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/category-templates/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toContainText('New', { timeout: 10000 });
    await context.close();
  });
});
