import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * PHASE 2-B — SEO foundation contract guards (source-level, no network).
 * Locks: founder-locked homepage metadata, marketplace preservation,
 * catalog authority endpoint shape, subcategory route architecture,
 * eligibility wiring, no-fabrication rules, sitemap exclusion.
 */
const web = process.cwd().replace(/[\\/]apps[\\/]web$/, '');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

const LOCKED_TITLE = 'B2B E-Marketplace for Products & Services for Commercial & Retail';
const MARKETPLACE_TITLE = 'TRADINGO | Global Marketplace to Buy Products & Services';

describe('PHASE 2-B — founder-locked metadata + catalog authority contracts', () => {
  it('1. homepage carries the locked title', () => {
    expect(read('apps/web/app/page.tsx')).toContain(`const HOMEPAGE_TITLE = '${LOCKED_TITLE}'`);
  });

  it('2. homepage carries the locked meta description (verbatim)', () => {
    expect(read('apps/web/app/page.tsx')).toContain(
      'Explore a wide range of products, raw materials, daily essentials, machinery, business supplies, and professional services from verified manufacturers, traders, distributors, and service providers worldwide. Find, Compare & Buy Products and Services with prices, connect directly with sellers, request quotations, and choose the right option for your business or everyday needs.',
    );
  });

  it('3. homepage canonical behavior preserved (root layout canonical, no page override)', () => {
    expect(read('apps/web/app/layout.tsx')).toMatch(/canonical:\s*'https:\/\/tradingo\.in'/);
    expect(read('apps/web/app/page.tsx')).not.toMatch(/alternates:\s*\{[^}]*canonical/);
  });

  it('4. marketplace title/H1 preserved (trading + products)', () => {
    expect(read('apps/web/app/products/page.tsx')).toContain(MARKETPLACE_TITLE);
    // The locked H1 lives (HTML-escaped) in the shared discovery client that
    // both /trading (via embedded ProductDiscovery) and /products render.
    expect(read('apps/web/components/discovery/ProductDiscoveryClient.tsx')).toContain(
      'Find, Compare &amp; Buy Products and Services',
    );
    expect(read('apps/web/app/trading/TradingDiscoveryClient.tsx')).toMatch(
      /import ProductDiscovery from '@\/components\/discovery\/ProductDiscoveryClient'/,
    );
  });

  it('5. public CatalogCategory-by-slug endpoint exists with public-safe shape', () => {
    const ctl = read('apps/api/src/modules/enterprise-catalog/controllers/taxonomy.controller.ts');
    expect(ctl).toMatch(/@Get\('categories\/slug\/:slug'\)/);
    expect(ctl).toMatch(/@Public\(\)[\s\S]{0,200}findCategoryBySlug/);
    const svc = read('apps/api/src/modules/enterprise-catalog/services/taxonomy.service.ts');
    expect(svc).toMatch(/async findCategoryBySlug\(slug: string\)/);
    expect(svc).toMatch(/NotFoundException\('Catalog category not found'\)/);
    expect(svc).toMatch(/activeProductCount/);
  });

  it('6. missing category resolves to 404 (service throws, page notFounds)', () => {
    const svc = read('apps/api/src/modules/enterprise-catalog/services/taxonomy.service.ts');
    expect(svc).toMatch(/if \(!category\) throw new NotFoundException/);
    const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
    expect(page).toMatch(/if \(!resolved\) notFound\(\)/);
  });

  it('7. subcategory canonical route exists (single pattern, category-scoped)', () => {
    expect(existsSync(join(web, 'apps/web/app/categories/[slug]/[subcategory]/page.tsx'))).toBe(true);
    const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
    expect(page).toMatch(/\.find\(\(s\) => s\.slug === subSlug\)/);
  });

  it('8. parent-category breadcrumb links resolve to real routes', () => {
    const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
    expect(page).toMatch(/href="\/trading"/);
    expect(page).toMatch(/href=\{`\/categories\/\$\{cat\.slug\}`\}/);
    expect(page).toMatch(/'@type': 'BreadcrumbList'/);
  });

  it('9. metadata fallback chain is deterministic (authority → record → naming)', () => {
    const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
    expect(page).toMatch(/sub\.seoTitle\?\.trim\(\) \|\|/);
    expect(page).toMatch(/sub\.seoDescription\?\.trim\(\) \|\|/);
    expect(page).toMatch(/alternates: \{ canonical \}/);
  });

  it('10. no fabricated SEO data (no ratings display, no invented counts, no random)', () => {
    const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
    expect(page).not.toMatch(/Math\.random/);
    // Search hits carry zeroed rating/review fields — the page must not render them.
    expect(page).not.toMatch(/rating:|reviewCount|aggregateRating|<Star|stars/i);
    // Catalog items render as unlinkable text (no item route exists yet).
    expect(page).toMatch(/no item route exists yet/);
  });

  it('11. eligibility engine wired (INDEX/HOLD/NOINDEX + robots mapping)', () => {
    const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
    expect(page).toMatch(/getSubcategoryEligibility\(/);
    expect(page).toMatch(/eligibilityRobots\(/);
    expect(page).toMatch(/activeProductCount: sub\.activeProductCount/);
  });

  it('12. sitemap emits no subcategory URLs this phase', () => {
    const sm = read('apps/web/app/sitemap.ts');
    expect(sm.toLowerCase()).not.toMatch(/subcategory/);
  });
});
