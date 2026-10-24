/**
 * Canonical six-plan entitlement catalog (Commercial Plan & Entitlement Engine, Part 1).
 *
 * Founder-approved commercial matrix, expressed as machine-readable PlanFeature
 * rows. This module is intentionally dependency-free (pure constants + parsers)
 * so the catalog, seeds, services and tests all share one definition.
 *
 * Value semantics per key kind:
 *  - 'limit'   : decimal string ("150"), "unlimited" sentinel, or missing → fallback.
 *                `included:false` means the benefit does not exist (e.g. RFQ 0).
 *  - 'boolean' : carried by the row `included` flag; `value` unused (null).
 *  - 'tier'    : opaque tier label string (e.g. "go_max"); `included:false`
 *                means the tier is "none".
 *
 * Different concern from the legacy PLAN_FEATURES display strings in
 * membership.service.ts (human-readable bullets). Both coexist: display
 * strings for UI copy, THESE keys for backend enforcement.
 */

export type EntitlementKind = 'limit' | 'boolean' | 'tier';

export interface EntitlementKeyDef {
  key: string;
  kind: EntitlementKind;
  category: string;
  label: string;
}

export const PLAN_ENTITLEMENT_KEYS: EntitlementKeyDef[] = [
  { key: 'product_listings_limit', kind: 'limit', category: 'listings', label: 'Product listings' },
  { key: 'price_tiers', kind: 'limit', category: 'listings', label: 'Price tiers (use "advanced" for Advanced Tier Pricing)' },
  { key: 'buyer_visibility', kind: 'tier', category: 'visibility', label: 'Buyer visibility scope' },
  { key: 'search_rank_tier', kind: 'tier', category: 'visibility', label: 'Search rank tier' },
  { key: 'featured_boost', kind: 'tier', category: 'visibility', label: 'Featured boost scope' },
  { key: 'go_reach_monthly', kind: 'limit', category: 'engagement', label: 'GO Reach per month' },
  { key: 'go_reach_carry_forward', kind: 'boolean', category: 'engagement', label: 'GO Reach carry forward' },
  { key: 'chat_level', kind: 'tier', category: 'engagement', label: 'Chat level' },
  { key: 'rfq_monthly_limit', kind: 'limit', category: 'engagement', label: 'RFQs per month (0 = none)' },
  { key: 'direct_orders', kind: 'tier', category: 'commerce', label: 'Direct orders' },
  { key: 'seller_badge', kind: 'tier', category: 'trust', label: 'Seller badge' },
  { key: 'branding_level', kind: 'tier', category: 'profile', label: 'Branding level' },
  { key: 'website_link', kind: 'boolean', category: 'profile', label: 'Website link' },
  { key: 'business_profile', kind: 'tier', category: 'profile', label: 'Business profile depth' },
  { key: 'catalog_pdf_limit', kind: 'limit', category: 'profile', label: 'Brochure/Catalogue PDFs (0 = none)' },
  { key: 'analytics_tier', kind: 'tier', category: 'growth', label: 'Analytics tier' },
  { key: 'rm_tier', kind: 'tier', category: 'support', label: 'Relationship manager tier' },
  // NOTE: `ai_credits` is intentionally NOT seeded here — AiCreditsService owns
  // that key's seeding. The resolver below reads it like any other key.
];

/** Matrix value per key: [Start, Smart, Plus, Pro, Premium, Elite]. */
interface MatrixRow {
  key: string;
  included: [boolean, boolean, boolean, boolean, boolean, boolean];
  value: [(string | null), (string | null), (string | null), (string | null), (string | null), (string | null)];
}

export const SIX_PLAN_IDS = [
  'trade_start',
  'trade_smart',
  'trade_plus',
  'trade_pro',
  'trade_premium',
  'trade_elite',
] as const;

export type SixPlanId = (typeof SIX_PLAN_IDS)[number];

const M = (
  key: string,
  included: MatrixRow['included'],
  value: MatrixRow['value'],
): MatrixRow => ({ key, included, value });

/** Founder-approved commercial matrix, machine-readable. Order = display order. */
export const PLAN_ENTITLEMENT_MATRIX: MatrixRow[] = [
  M('product_listings_limit', [true, true, true, true, true, true], ['25', '50', '75', '100', '150', 'unlimited']),
  M('price_tiers', [true, true, true, true, true, true], ['1', '1', '2', '4', '4', 'advanced']),
  M('buyer_visibility', [true, true, true, true, true, true], ['local_district', '5_districts', 'same_state', '5_states', 'pan_india', 'global']),
  M('search_rank_tier', [true, true, true, true, true, true], ['low', 'top_200', 'top_100', 'top_50', 'top_20', 'top_10']),
  M('featured_boost', [false, true, true, true, true, true], [null, 'local', 'state', '5_state', 'pan_india', 'top_priority_global']),
  M('go_reach_monthly', [true, true, true, true, true, true], ['25', '50', '100', '250', '500', '1000']),
  M('go_reach_carry_forward', [true, true, true, true, true, true], [null, null, null, null, null, null]),
  M('chat_level', [true, true, true, true, true, true], ['basic', 'go_basic', 'go_level_2', 'go_level_3', 'go_level_4', 'go_max']),
  M('rfq_monthly_limit', [false, true, true, true, true, true], [null, '20', '30', '40', '50', 'unlimited']),
  M('direct_orders', [true, true, true, true, true, true], ['full', 'full', 'full', 'full', 'full', 'full_priority']),
  M('seller_badge', [true, true, true, true, true, true], ['go_start', 'go_verified', 'go_priority', 'go_trusted', 'go_premium', 'go_elite']),
  M('branding_level', [false, true, true, true, true, true], [null, 'basic_logo', 'logo_banner', 'advanced', 'advanced', 'full_suite']),
  M('website_link', [false, false, true, true, true, true], [null, null, null, null, null, null]),
  M('business_profile', [true, true, true, true, true, true], ['basic', 'standard', 'website', 'website_pdf', 'website_pdf', 'full_pdf']),
  M('catalog_pdf_limit', [false, false, true, true, true, true], [null, null, '2', '5', '10', 'unlimited']),
  M('analytics_tier', [false, true, true, true, true, true], [null, 'basic', 'basic', 'full', 'full', 'full_ai']),
  M('rm_tier', [false, true, true, true, true, true], [null, 'shared', 'priority', 'senior', 'senior', 'dedicated']),
];

export interface ResolvedEntitlement {
  included: boolean;
  value: string | null;
}

export type EntitlementMap = Record<string, ResolvedEntitlement>;

/** Parse a limit value: "unlimited"/"-1" → Infinity, decimals → int, else fallback. */
export function parseLimit(value: string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const v = value.trim().toLowerCase();
  if (v === 'unlimited' || v === '-1' || v === 'infinite' || v === '∞') return Infinity;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Numeric convenience over a resolved map. Missing key → fallback. */
export function entitlementLimit(map: EntitlementMap, key: string, fallback: number): number {
  const e = map[key];
  if (!e) return fallback;
  if (!e.included) return 0;
  if (e.value === null) return fallback;
  if (e.value.trim().toLowerCase() === 'advanced') return Infinity;
  return parseLimit(e.value, fallback);
}

export function entitlementBoolean(map: EntitlementMap, key: string, fallback = false): boolean {
  const e = map[key];
  return e ? e.included : fallback;
}

export function entitlementString(map: EntitlementMap, key: string, fallback: string | null = null): string | null {
  const e = map[key];
  if (!e) return fallback;
  if (!e.included) return null;
  return e.value ?? fallback;
}

/**
 * Convert a version-row snapshot (`features` Json as written by
 * backfillPlanVersions: array of {feature, included, value, ...}) back into
 * an EntitlementMap. Defensive: non-array payloads yield an empty map rather
 * than throwing, so a corrupt snapshot can never crash resolution (the
 * caller then falls through to its documented fallback).
 */
export function versionFeaturesToMap(features: unknown): EntitlementMap {
  const map: EntitlementMap = {};
  if (!Array.isArray(features)) return map;
  for (const f of features) {
    if (!f || typeof f !== 'object') continue;
    const rec = f as Record<string, unknown>;
    if (typeof rec.feature !== 'string' || rec.feature in map) continue;
    map[rec.feature] = {
      included: rec.included === true,
      value: typeof rec.value === 'string' ? rec.value : null,
    };
  }
  return map;
}

// ── Commercial variants (tiers) ────────────────────────────────────────────
// Founder matrix: Plan A = GO Offer Year, Plan B = Launch Year,
// Plan C = Annual Plan. A variant is (planId, tier); tiers map 1:1 to the
// pricePlanA/B/C columns. Durations stay on the plan row / purchase params
// (see P1-01 duration finding); this helper centralizes column selection.

export const PLAN_TIERS = ['A', 'B', 'C'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const TIER_VARIANT_LABELS: Record<PlanTier, string> = {
  A: 'GO Offer Year',
  B: 'Launch Year',
  C: 'Annual Plan',
};

export function resolveVariantPrice(
  plan: { pricePlanA: number; pricePlanB: number; pricePlanC: number },
  tier: string,
): number {
  const t = (tier || 'A').toUpperCase();
  if (t === 'B') return plan.pricePlanB;
  if (t === 'C') return plan.pricePlanC;
  return plan.pricePlanA;
}

// ── Customer-facing comparison display (P2A) ─────────────────────────────────
// Presentation-only human copy for PLAN_ENTITLEMENT_MATRIX. Business rules
// (included flags, machine values) stay SOLELY in the matrix above; this map
// carries only Founder-approved display strings, keyed by the SAME canonical
// keys. Boolean-kind keys derive yes/no from the matrix `included` flags at
// assembly time (no display strings stored for them). Structural parity
// (every matrix key has a display entry and vice versa) is pinned by tests —
// the two maps cannot drift in shape, only curated copy lives here.
export interface EntitlementDisplay {
  title: string;
  /** Six plan-ordered display strings; null = derive from matrix `included` (boolean keys). */
  values: [string, string, string, string, string, string] | null;
}

export const ENTITLEMENT_DISPLAY: Record<string, EntitlementDisplay> = {
  product_listings_limit: { title: 'Product Listings', values: ['25', '50', '75', '100', '150', 'Unlimited'] },
  price_tiers: { title: 'Flexible Pricing', values: ['Single', 'Single', '2 tiers', '4 tiers', '4 tiers', 'Advanced Tier Pricing'] },
  buyer_visibility: { title: 'Buyer Visibility', values: ['Local Area/same District', '5 District', 'Same State', '5 state', 'Pan-India', 'Global Buyers'] },
  search_rank_tier: { title: 'Search Rank', values: ['Low', 'Medium Top~200', 'High Top~100', 'Very High Top~50', 'Very High Top~20', 'Top 1–10'] },
  featured_boost: { title: 'Featured Visibility', values: ['none', 'Local Boost', 'State Boost', '5 State Boost', 'Pan-India Boost', 'Top Priority + Global Boost'] },
  go_reach_monthly: { title: 'GO Reach Unlock', values: ['25', '50/month', '100/month', '250/month', '500/month', '1000/month'] },
  go_reach_carry_forward: { title: 'GO Reach Carry Forward', values: null },
  chat_level: { title: 'Chat System', values: ['Basic', 'GO Basic', 'GO Level-2', 'GO Level-3', 'GO Level-4', 'GO MAX'] },
  rfq_monthly_limit: { title: 'RFQ', values: ['none', '20/month', '30/month', '40/month', '50/month', 'Unlimited + Auto Match'] },
  direct_orders: { title: 'Direct Orders', values: ['Full', 'Full', 'Full', 'Full', 'Full', 'Full (Priority)'] },
  seller_badge: { title: 'Seller Badge', values: ['GO Start', 'GO Verified', 'GO Priority', 'GO Trusted', 'GO Premium', 'GO Elite'] },
  branding_level: { title: 'Branding', values: ['none', 'Basic Logo', 'Logo + Banner', 'Advanced Branding', 'Advanced Branding', 'Full Branding Suite'] },
  website_link: { title: 'Website Link', values: null },
  business_profile: { title: 'Business Profile Details', values: ['Basic', 'Standard Business Info', 'Business + Website', 'Business + Website + PDF', 'Business + Website + PDF', 'Full Company Profile + PDFs'] },
  catalog_pdf_limit: { title: 'Brochure/Catalogue PDF', values: ['no', 'no', '1–2 PDFs', '1–5 PDFs', '1–10 PDFs', 'Multiple PDFs'] },
  analytics_tier: { title: 'Analytics', values: ['none', 'Basic', 'Basic', 'Full', 'Full', 'Full + AI Insights'] },
  rm_tier: { title: 'Relationship Manager', values: ['none', 'Shared Support', 'Priority Support', 'Senior Support', 'Senior Support', 'Dedicated RM'] },
};

export interface ComparisonRow {
  key: string;
  title: string;
  values: [string, string, string, string, string, string];
}

export interface ComparisonMatrix {
  plans: string[];
  rows: ComparisonRow[];
}

/** Deterministic assembly: matrix order, boolean keys derived from `included`. */
export function buildComparisonMatrix(): ComparisonMatrix {
  const defs = new Map(PLAN_ENTITLEMENT_KEYS.map((d) => [d.key, d]));
  const rows: ComparisonRow[] = PLAN_ENTITLEMENT_MATRIX.map((m) => {
    const disp = ENTITLEMENT_DISPLAY[m.key];
    const kind = defs.get(m.key)?.kind;
    const values =
      kind === 'boolean'
        ? (m.included.map((i) => (i ? 'yes' : 'no')) as ComparisonRow['values'])
        : (disp?.values ?? (m.included.map(() => '—') as ComparisonRow['values']));
    return { key: m.key, title: disp?.title ?? defs.get(m.key)?.label ?? m.key, values };
  });
  return { plans: [...SIX_PLAN_IDS], rows };
}
