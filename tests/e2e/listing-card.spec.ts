import { test, expect, Page } from '@playwright/test';
import { BUYER_USER, loginAs } from '../helpers/auth';

/**
 * Product Card #17 E2E coverage (R8).
 *
 * Targets the CURRENT locked card (apps/web/components/product/product-card.tsx,
 * read-only — never modified by tests):
 *   root  div.stacked-card-wrapper > div.@container.rounded-2xl
 *   title h3 inside a[href="/products/{slug}"]
 *   CTAs  "Buy Now" / "Request for Quote (RFQ)" / Chat / Save / Compare / Info
 *   links /products/{slug} (title, Info) and /companies/{slug} (seller)
 *
 * Deterministic surface: /categories/pcb-components renders the E2E seed
 * product "Industrial PCB Board 4-Layer" (ACTIVE, moq 100, slabs
 * [100-499 @ Rs.10.50], IN_STOCK, LEVEL_2 company) through
 * fromBasicProduct as a compact Card #17 with actions enabled.
 *
 * Requires the local E2E stack (web :3000 + API :3001 + seeded DB +
 * `npx playwright install`). No production dependency, no fake data,
 * no order submission, no payment execution, no stock-rejection assertions.
 */

const CARD_ROOT = '.stacked-card-wrapper';
const PRODUCT_TITLE = 'Industrial PCB Board 4-Layer';
const PRODUCT_SLUG = 'industrial-pcb-board-4-layer';
const SELLER_COMPANY_SLUG = 'cmp-seller-001';

async function findCard(page: Page, title: string) {
  const heading = page.locator(`${CARD_ROOT} h3`, { hasText: title }).first();
  await expect(heading).toBeVisible({ timeout: 20000 });
  return page.locator(CARD_ROOT).filter({ has: heading }).first();
}

test.describe('Product Card #17', () => {
  test('A1 renders identity, seller, price and availability', async ({ page }) => {
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    await expect(page.getByText('1 product available')).toBeVisible({ timeout: 20000 });

    const card = await findCard(page, PRODUCT_TITLE);
    await expect(card.locator(`a[href*="/products/${PRODUCT_SLUG}"]`).first()).toBeVisible();
    // R1 slab price for the seed product (first slab), never NaN.
    await expect(card.getByText(/₹[1-9][\d,]*(\.\d+)?/).first()).toBeVisible();
    await expect(card.getByText('Test Seller Company').first()).toBeVisible();
    await expect(card.getByText('In Stock', { exact: true }).first()).toBeVisible();
    await expect(card.getByText('Verified Product', { exact: true }).first()).toBeVisible();
    await expect(card.getByText(/100 piece/).first()).toBeVisible();
  });

  test('A2 shows no fabricated rating or reward chips', async ({ page }) => {
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);
    // Seed product has no approved reviews: R4 honesty means no rating chip.
    await expect(card.getByText('Seller Rating')).toHaveCount(0);
    // No per-price GOCASH earn rate exists: R4 removed the fabricated chip.
    await expect(card.getByText(/GOCASH/)).toHaveCount(0);
  });

  test('B title and Info actions reach the product detail page', async ({ page }) => {
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    await card.locator(`a[href*="/products/${PRODUCT_SLUG}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/products/${PRODUCT_SLUG}`), { timeout: 15000 });
    await expect(page.getByText(PRODUCT_TITLE).first()).toBeVisible({ timeout: 20000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/categories\/pcb-components/);
    const cardAgain = await findCard(page, PRODUCT_TITLE);
    await cardAgain.getByRole('link', { name: 'View product details' }).click();
    await expect(page).toHaveURL(new RegExp(`/products/${PRODUCT_SLUG}`), { timeout: 15000 });
  });

  test('C Buy Now reaches checkout with server-priced totals', async ({ page }) => {
    await loginAs(page, BUYER_USER);
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    await card.getByRole('button', { name: 'Buy Now' }).click();
    // Card sends productId + selected qty; server resolves the slab price.
    await expect(page).toHaveURL(/\/checkout\?productId=[^&]+&qty=\d+/, { timeout: 15000 });
    // Seed slab [100-499 @ Rs.10.50] at the card default qty 100.
    await expect(page.getByText('₹10.50').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('₹1050.00').first()).toBeVisible({ timeout: 20000 });
    // No order is submitted and no payment is executed by this test.
  });

  test('D1 unauthenticated Buy Now preserves the checkout return context', async ({ page }) => {
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    await card.getByRole('button', { name: 'Buy Now' }).click();
    // R6: gated CTA redirects to login with the intended destination kept.
    await expect(page).toHaveURL(/\/login\?next=.*checkout.*productId/, { timeout: 15000 });
  });

  test('D2 unauthenticated RFQ preserves the composer return context', async ({ page }) => {
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    await card.getByRole('button', { name: 'Request for Quote (RFQ)' }).click();
    await expect(page).toHaveURL(/\/login\?next=.*rfq/, { timeout: 15000 });
  });

  test('E1 RFQ entry reaches the composer with product context', async ({ page }) => {
    await loginAs(page, BUYER_USER);
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    await card.getByRole('button', { name: 'Request for Quote (RFQ)' }).click();
    await expect(page).toHaveURL(/\/buyer\/rfq\/new\?source=PRODUCT&sourceId=[^&]+/, { timeout: 15000 });
    await page.waitForLoadState('load');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20000 });
  });

  test('E2 Chat entry opens the seller conversation thread', async ({ page }) => {
    await loginAs(page, BUYER_USER);
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    await card.getByRole('button', { name: 'Chat with seller' }).click();
    // Open-or-create resolves server-side to a role-aware inbox thread.
    await expect(page).toHaveURL(/\/buyer\/inbox\/[^/]+/, { timeout: 30000 });
  });

  test('E3 seller block links to the company profile', async ({ page }) => {
    await page.goto('/categories/pcb-components');
    await page.waitForLoadState('load');
    const card = await findCard(page, PRODUCT_TITLE);

    const sellerLink = card.locator(`a[href*="/companies/${SELLER_COMPANY_SLUG}"]`).first();
    await expect(sellerLink).toBeVisible();
    await sellerLink.click();
    await expect(page).toHaveURL(new RegExp(`/companies/${SELLER_COMPANY_SLUG}`), { timeout: 15000 });
    await page.waitForLoadState('load');
  });
});
