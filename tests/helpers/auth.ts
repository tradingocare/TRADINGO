import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  roleKey?: 'buyer' | 'vendor' | 'admin';
  identifier?: string;
}

export const BUYER_USER: TestUser = {
  email: process.env.E2E_BUYER_EMAIL || 'e2e-buyer@tradingo.com',
  password: process.env.E2E_BUYER_PASSWORD || 'TestBuyer@123',
  name: 'E2E Buyer',
  roleKey: 'buyer',
};

export const SELLER_USER: TestUser = {
  email: process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com',
  password: process.env.E2E_SELLER_PASSWORD || 'TestSeller@123',
  name: 'E2E Seller',
  roleKey: 'vendor',
  identifier: 'AABCE1234E',
};

export const ADMIN_USER: TestUser = {
  email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123',
  name: 'E2E Admin',
  roleKey: 'admin',
};

export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('input[autocomplete="username"], input[type="email"], input[name="email"]', { timeout: 10000 });

  if (user.roleKey && user.roleKey !== 'buyer') {
    const tabLabel = user.roleKey === 'vendor' ? 'Seller' : 'Admin';
    const tab = page.locator(`button:has-text("${tabLabel}")`).first();
    await tab.click();
  }

  const identifier = user.identifier || user.email;
  const emailInput = page.locator('input[autocomplete="username"], input[type="email"], input[name="email"]').first();
  await emailInput.fill(identifier);

  const passwordInput = page.locator('input[autocomplete="current-password"], input[type="password"]').first();
  await passwordInput.fill(user.password);

  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
  await submitButton.click();

  await page.waitForURL(/dashboard|\/seller\/|\/buyer\/|\/admin\//, { timeout: 20000 });
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
