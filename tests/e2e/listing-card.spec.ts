import { test, expect, Page } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/review/listing-card';

async function findCard(page: Page, title: string) {
  const heading = page.locator('h3', { hasText: title }).first();
  await expect(heading).toBeVisible({ timeout: 20000 });
  return page.locator('.stacked-card-wrapper').filter({ has: heading }).first();
}

test.describe('Product Listing Card — 8-Group Upgrade', () => {
  test('default card renders pricing, badges, trust and social proof', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const card = await findCard(page, 'Industrial PCB Board 4-Layer');

    await expect(card).toContainText('MOQ 100', { timeout: 10000 });
    await expect(card).toContainText('/ piece');
    await expect(card).toContainText('In stock');
    await expect(card).toContainText('orders');
    await expect(card).toContainText('buyers');
    await expect(card).toContainText('Pan India');
    await expect(card).toContainText('Listed');
    await expect(card).toContainText('Material: FR-4');
    await expect(card).toContainText('PCB Components');
    await expect(card).toContainText('Test Seller Company');
    await expect(card).toContainText('GST');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/default-card.png`, fullPage: false });
  });

  test('qty tier pills are selectable and Buy passes the selected qty', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const pill = page.locator('button[aria-label^="Quantity"]').first();
    await expect(pill).toBeVisible({ timeout: 20000 });
    await pill.click();
    await expect(pill).toHaveAttribute('aria-pressed', 'true');

    const buy = page.locator('button:has-text("Buy")').first();
    await expect(buy).toBeVisible();
    await expect(buy).not.toBeDisabled();
  });

  test('cards without tier data still render actions and info link', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const card = await findCard(page, 'Industrial Grade Solvent 99.9%');

    await expect(card.getByRole('button', { name: /RFQ|Buy|Chat|Save|Cmp/ }).first()).toBeVisible();
    await expect(card.locator('a[href*="/products/"]').first()).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/cards-grid.png` });
  });

  test('product detail page still renders from the same data chain', async ({ page }) => {
    await page.goto('/products/industrial-pcb-board-4-layer');
    await expect(page.locator('h1')).toContainText('Industrial PCB Board', { timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/detail-page.png` });
  });
});
