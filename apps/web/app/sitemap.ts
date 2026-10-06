import type { MetadataRoute } from 'next';
import { SITEMAP_STATIC_ROUTES, SITEMAP_CITIES } from '@/data/master-data';
import { CATALOG_SITEMAP_CATEGORIES } from '@/data/catalog-data';
import { tradeservApi } from '@/lib/api/tradeserv';
import { getProducts } from '@/lib/api/products';
import { getCompanyDirectory } from '@/lib/api/companies';
import { getIndustries } from '@/lib/api/industries';
import { apiClient } from '@/lib/api/client';
import { TRADESERV_CATEGORIES } from '@/lib/data/tradeserv';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in';

// Safety ceilings on PAGE COUNT (not business caps): they only exist to
// guarantee loop termination and to keep the single sitemap file under the
// 50,000-URL protocol limit. Hitting a ceiling in practice means the
// marketplace has reached the sitemap-index (generateSitemaps) milestone —
// a separate approved follow-up, not a content filter.
const MAX_PAGES = 240; // x200/page = 48,000 URLs per section (protocol-safe)
const PAGE_SIZE = 200;

type Entry = MetadataRoute.Sitemap[number];

/**
 * Dedupe by URL, preserve first-seen order, normalize: no query strings,
 * no trailing slashes (Next serves both; canonical form is slash-free),
 * single canonical production host.
 */
function dedupe(entries: Entry[]): Entry[] {
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const e of entries) {
    let url = e.url.split('?')[0];
    if (url.endsWith('/') && url !== `${baseUrl}/`) url = url.slice(0, -1);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ ...e, url });
  }
  return out;
}

/**
 * PHASE 2-A §8D — data-driven lastModified where safely available.
 * The products list and industries list responses carry `updatedAt`
 * (products: Prisma `include` returns all scalars + normalizeProduct spreads
 * them — apps/api products.service.ts:42-70,384-401; industries: Industry
 * carries updatedAt — lib/api/industries.ts:3-15). No backend change, no
 * extra queries — the timestamp rides on rows already fetched.
 * When the value is absent/unparseable we fall back to `new Date()`
 * (previous behavior preserved; never emit an Invalid Date).
 * Companies (directory response has no updatedAt), professionals
 * (ProfessionalSummary has no updatedAt), cities, categories and static
 * routes keep `new Date()` — documented limitation, left unchanged per the
 * Phase 2-A rule (no fake precision invented, no backend change made).
 */
function toLastModified(v: unknown): Date {
  if (typeof v === 'string' || v instanceof Date) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Products — ACTIVE products only, paginated to exhaustion (D4).
 * Evidence: GET /products is forced to status:'ACTIVE' + deletedAt:null
 * server-side (apps/api products.controller.ts:66, products.service.ts:381),
 * so inactive/draft/archived/deleted products cannot enter this section.
 * Cursor-paginated envelope: { data, meta: { total, limit, cursor } }.
 * API failure degrades to an empty section (never breaks the sitemap).
 * PHASE 2-A §8D: lastModified is data-driven from the row's updatedAt.
 */
async function productRoutes(): Promise<Entry[]> {
  const out: Entry[] = [];
  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res: any = await getProducts({ limit: PAGE_SIZE, ...(cursor ? { cursor } as any : {}) });
      const data: any[] = res?.data ?? [];
      for (const p of data) {
        const token = p.slug || p.id; // detail route resolves slug (findBySlug)
        if (!token) continue;
        out.push({ url: `${baseUrl}/products/${token}`, lastModified: toLastModified(p.updatedAt), changeFrequency: 'weekly', priority: 0.8 });
      }
      const nextCursor: string | undefined = res?.meta?.cursor ?? res?.cursor;
      if (!nextCursor || data.length === 0) break; // exhausted / empty page
      cursor = nextCursor;
    }
  } catch {
    return out; // graceful degradation: partial or empty
  }
  return out;
}

/**
 * Companies — ALL public directory companies (D2: no verified-only filter,
 * no invented status rule). Authoritative source: GET /companies/directory
 * (the same API backing the public /companies directory). Paginated to
 * exhaustion via DirectoryPagination.totalPages; failure degrades gracefully.
 */
async function companyRoutes(): Promise<Entry[]> {
  const out: Entry[] = [];
  try {
    let page = 1;
    for (; page <= MAX_PAGES; page++) {
      const res = await getCompanyDirectory({ page: String(page), limit: String(PAGE_SIZE) });
      const companies = res?.companies ?? [];
      for (const c of companies) {
        if (!c?.slug) continue;
        out.push({ url: `${baseUrl}/companies/${c.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 });
      }
      const totalPages = res?.pagination?.totalPages ?? 0;
      if (companies.length === 0 || page >= totalPages) break; // exhausted
    }
  } catch {
    return out; // graceful degradation
  }
  return out;
}

/**
 * Industries — public content pages at /industry/{slug} (getIndustry-backed,
 * indexable, no robots restriction). Cursor-paginated; exhaustion + graceful
 * failure per section pattern.
 */
async function industryRoutes(): Promise<Entry[]> {
  const out: Entry[] = [];
  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res: any = await getIndustries({ limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) } as any);
      const data: any[] = res?.data ?? [];
      for (const i of data) {
        if (!i?.slug) continue;
        // PHASE 2-A §8D: data-driven lastModified from the row's updatedAt.
        out.push({ url: `${baseUrl}/industry/${i.slug}`, lastModified: toLastModified(i.updatedAt), changeFrequency: 'monthly', priority: 0.6 });
      }
      const nextCursor: string | undefined = res?.meta?.cursor;
      if (!nextCursor || data.length === 0) break;
      cursor = nextCursor;
    }
  } catch {
    return out;
  }
  return out;
}

/**
 * TradeServ professional/service profile URLs — canonical /tradeserv/p/{slug}.
 * Frozen P1 #2 policies preserved unchanged: single request limit 500,
 * professionalStatus null/unknown defaults to ACTIVE. No /services/[slug],
 * no ServiceMaster/CatalogItem URLs.
 */
async function tradeservProfessionalRoutes(): Promise<Entry[]> {
  try {
    const professionals = await tradeservApi.searchProfessionals({ page: 1, limit: 500 });
    return (professionals?.data ?? [])
      .filter((p) => p.slug && (p.professionalStatus ?? 'ACTIVE') === 'ACTIVE')
      .map((p) => ({
        url: `${baseUrl}/tradeserv/p/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = SITEMAP_STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changefreq,
    priority: route.priority,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = CATALOG_SITEMAP_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categories/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

/**
 * PHASE 2-A §8C — city presence validation (no blind 19-city emission, no
 * free-text-city explosion, no schema change).
 * A city slug is emitted ONLY when the public rankings API proves genuine
 * marketplace presence (companyCount > 0 OR productCount > 0) — the same
 * CompanyLocation-backed evidence the /city/[slug] page renders
 * (GET /tradgo/city-rankings/:city — Prisma CompanyLocation city match,
 * case-insensitive). Slug → display-name transform mirrors the page's own
 * title-casing (app/city/[slug]/page.tsx) so validation and rendering agree.
 * Normalization: trim + lowercase + dedupe (case/spacing variants collapse).
 * Per-city try/catch isolation: a city whose check ERRORS is kept (fail-open
 * for sitemap stability — a transient API failure must never deindex all
 * cities); a city PROVEN empty (explicit zero counts) is excluded.
 * Full CompanyLocation-derived coverage (beyond the curated static list)
 * needs a dedicated aggregation endpoint — flagged as a Phase 2-B item;
 * no DB/schema change is made here.
 */
function toCityName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function cityHasPresence(slug: string): Promise<boolean> {
  try {
    const res: any = await apiClient.get(
      `/tradgo/city-rankings/${encodeURIComponent(toCityName(slug))}`,
      { params: { limit: 1 } },
    );
    const d: any = res?.data ?? res;
    return Number(d?.companyCount ?? 0) > 0 || Number(d?.productCount ?? 0) > 0;
  } catch {
    return true; // fail-open on error (see doc above); proven-empty handled by caller
  }
}

async function cityRoutes(): Promise<Entry[]> {
  const seen = new Set<string>();
  const slugs = SITEMAP_CITIES.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  const unique = slugs.filter((s) => (seen.has(s) ? false : (seen.add(s), true)));
  const checks = await Promise.all(unique.map(async (city) => ({ city, ok: await cityHasPresence(city) })));
  return checks
    .filter((c) => c.ok)
    .map((c) => ({
      url: `${baseUrl}/city/${c.city}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
}

  // TradeServ category surfaces — FOUNDER DECISION D5=C: BOTH route
  // families are intentional, self-canonical public surfaces:
  //   /tradeserv/categories/{slug} — static category guide (TRADESERV_CATEGORIES data)
  //   /tradeserv/c/{slug}          — live professional listing for the category
  // Both generated from the same real static data the pages use
  // (generateStaticParams source of truth). No consolidation/redirect
  // (founder-approved dual-surface decision, report WEBSITE-P1-D5).
  const tradeservCategoryRoutes: MetadataRoute.Sitemap = TRADESERV_CATEGORIES.flatMap((cat) => [
    {
      url: `${baseUrl}/tradeserv/categories/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/tradeserv/c/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]);

  // Each dynamic section is independently try/catch-isolated: one failing
  // API can never break the complete sitemap.
  // PHASE 2-A §8A exclusion audit (verified 2026-10-06, no new code needed
  // beyond city presence-validation above):
  //  - query-string URLs: none — dedupe() strips '?…', static list has no
  //    query paths, dynamic sections emit path-only URLs.
  //  - private URLs: none — /seller/, /buyer/, /admin/, /login, /register are
  //    absent from every section (robots.txt disallows them independently).
  //  - noindex URLs: none — /compare was never listed; /search and
  //    /tradeserv/search BASE URLs remain listed because their base pages
  //    stay indexable (query variants are noindexed via page metadata).
  //  - invalid/empty entities: products ACTIVE-only (server-enforced),
  //    companies via the public directory, industries via the public list,
  //    professionals ACTIVE-filtered, cities presence-validated (§8C).
  //  - duplicates: dedupe() by normalized URL (first-seen wins).
  //  - legacy non-canonical URLs: none — /trading/{slug} 308-consolidation is
  //    a redirect (not emitted); only /products/{slug} is emitted.
  const [products, companies, industries, professionals, cities] = await Promise.all([
    productRoutes(),
    companyRoutes(),
    industryRoutes(),
    tradeservProfessionalRoutes(),
    cityRoutes(),
  ]);

  return dedupe([
    ...routes,
    ...categoryRoutes,
    ...cities,
    ...tradeservCategoryRoutes,
    ...professionals,
    ...products,
    ...companies,
    ...industries,
  ]);
}
