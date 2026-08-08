import { test, expect, Page } from '@playwright/test';
import { BUYER_USER, loginAs } from '../helpers/auth';

const SCREENSHOT_DIR = 'docs/review/listing-card';

const CARD_SELECTOR = 'section.rounded-2xl';

async function findCard(page: Page, title: string) {
  const heading = page.locator('h2', { hasText: title }).first();
  await expect(heading).toBeVisible({ timeout: 20000 });
  return page.locator(CARD_SELECTOR).filter({ has: heading }).first();
}

test.describe('Product Listing Card — 8-Group Upgrade', () => {
  test('default card renders pricing, badges, trust and social proof', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('load');
    const card = await findCard(page, 'Industrial PCB Board 4-Layer');

    await expect(card.getByText('Offer Price', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(card.getByText('MOQ', { exact: true }).first()).toBeVisible();
    await expect(card.getByText('TradTrust', { exact: true }).first()).toBeVisible();
    await expect(card.getByText('Company Profile', { exact: true }).first()).toBeVisible();
    await expect(card.getByText('Buy / Place Order').first()).toBeVisible();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/default-card.png`, fullPage: false });
  });

  test('Buy / Place Order navigates to checkout', async ({ page }) => {
    await loginAs(page, BUYER_USER);
    await page.goto('/products');
    await page.waitForLoadState('load');

    const card = await findCard(page, 'Industrial PCB Board 4-Layer');
    const buy = card.getByRole('button', { name: /Buy \/ Place Order/ }).first();
    await expect(buy).toBeVisible({ timeout: 10000 });
    await buy.scrollIntoViewIfNeeded();
    for (let attempt = 0; attempt < 3; attempt++) {
      await buy.evaluate((el) => (el as HTMLElement).click());
      try {
        await expect(page).toHaveURL(/\/checkout\?productId=/, { timeout: 4000 });
        break;
      } catch {
        // card may have re-rendered mid-click (auth hydration); re-resolve and retry
      }
    }
    await expect(page).toHaveURL(/\/checkout\?productId=/, { timeout: 5000 });
  });

  test('cards still render actions and info link', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('load');

    const heading = page.locator('h2').first();
    await expect(heading).toBeVisible({ timeout: 20000 });
    const card = page.locator(CARD_SELECTOR).filter({ has: heading }).first();

    await expect(card.getByRole('button', { name: /Request Call \/ RFQ/ }).first()).toBeVisible();
    await expect(card.getByText('Chat with Seller').first()).toBeVisible();
    await expect(card.locator('a[href*="/products"]').first()).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/cards-grid.png` });
  });

  test('product detail page still renders from the same data chain', async ({ page }) => {
    await page.goto('/products/industrial-pcb-board-4-layer');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Industrial PCB Board', { timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/detail-page.png` });
  });
});
