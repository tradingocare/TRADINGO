import { Page, expect } from '@playwright/test';

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function expectPageTitle(page: Page, title: string): Promise<void> {
  await expect(page.locator('h1').first()).toContainText(title, { timeout: 10000 });
}

export async function expectNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  await new Promise((r) => setTimeout(r, 1000));
  expect(errors).toHaveLength(0);
}

export async function waitForSettled(page: Page): Promise<void> {
  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle');
}
