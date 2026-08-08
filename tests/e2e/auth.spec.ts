import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth-fixture';
import { loginAs, logout, BUYER_USER, SELLER_USER, ADMIN_USER } from '../helpers/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function accessToken(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem('accessToken') || '');
}

test.describe('Authentication', () => {
  test('should reject unauthenticated API access', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const res = await page.request.get(`${API_URL}/users/me`);
    expect([401, 403]).toContain(res.status());
    await context.close();
  });

  test('should login as buyer and see buyer dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await expect(page).toHaveURL(/\/buyer\//, { timeout: 10000 });
    await context.close();
  });

  test('should login as seller and see seller dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await expect(page).toHaveURL(/\/seller\//, { timeout: 10000 });
    await context.close();
  });

  test('should login as admin and see admin dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await expect(page).toHaveURL(/\/admin\//, { timeout: 10000 });
    await context.close();
  });

  test('should maintain session across page navigation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);

    await page.goto('/seller/dashboard');
    await expect(page).toHaveURL(/\/seller\/dashboard/);

    await page.goto('/seller/products');
    await expect(page).toHaveURL(/\/seller\/products/);

    await page.goto('/seller/settings');
    await expect(page).toHaveURL(/\/seller\/settings/);

    await context.close();
  });

  test('should clear stored session on logout', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    expect(await accessToken(page)).toBeTruthy();

    await logout(page);
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeFalsy();

    await context.close();
  });

  test('should reject buyer access to admin APIs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    const token = await accessToken(page);
    const res = await page.request.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
    await context.close();
  });

  test('should reject seller access to admin APIs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    const token = await accessToken(page);
    const res = await page.request.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
    await context.close();
  });

  test('should allow admin access to admin APIs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    const token = await accessToken(page);
    const res = await page.request.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    await context.close();
  });
});
