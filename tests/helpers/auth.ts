import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export const BUYER_USER: TestUser = {
  email: process.env.E2E_BUYER_EMAIL || 'e2e-buyer@tradingo.com',
  password: process.env.E2E_BUYER_PASSWORD || 'TestBuyer@123',
  name: 'E2E Buyer',
};

export const SELLER_USER: TestUser = {
  email: process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com',
  password: process.env.E2E_SELLER_PASSWORD || 'TestSeller@123',
  name: 'E2E Seller',
};

export const ADMIN_USER: TestUser = {
  email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123',
  name: 'E2E Admin',
};

export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(user.email);

  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(user.password);

  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
  await submitButton.click();

  await page.waitForURL(/dashboard|\/seller\/|\/buyer\/|\/admin\//, { timeout: 15000 });
}

export async function logout(page: Page): Promise<void> {
  await page.goto('/login');
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}
