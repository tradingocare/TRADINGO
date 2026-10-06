/**
 * PHASE 2-A — SEO FOUNDATION CLEANUP: shared indexing-policy helpers.
 *
 * Purpose:
 *  - Decide per-request robots/canonical policy for query-driven public
 *    surfaces (/search, /trading, /products, /tradeserv/search, /compare).
 *  - Ignore analytics/tracking params (utm_*, gclid, fbclid, ...) so a
 *    UTM-tagged base URL is never treated as a "filtered" variant.
 *  - Normalize Next.js 15+ async `searchParams` (Promise) and sync shapes
 *    (plain object, URLSearchParams) into one plain record WITHOUT touching
 *    any existing page prop handling.
 *
 * Policy contract (per-route callers own the final metadata):
 *  - base (no index-affecting params) → indexable + self-canonical
 *  - filtered/paginated/query variant  → noindex + follow + self-canonical
 *    (follow preserves link equity; self-canonical never points a filtered
 *    view at a different page — no fake canonicals).
 *
 * No backend, schema, route, or UX change lives here. Pure functions only.
 */

export const TRACKING_PARAMS: ReadonlySet<string> = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'vero_id',
  'ref',
  'referrer',
  '_ga',
]);

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Anything Next.js may hand to generateMetadata/page as `searchParams`. */
export type SearchParamsLike =
  | SearchParamsRecord
  | URLSearchParams
  | Promise<SearchParamsRecord | URLSearchParams>
  | null
  | undefined;

function isUrlSearchParamsLike(v: unknown): v is URLSearchParams {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as URLSearchParams).get === 'function' &&
    typeof (v as URLSearchParams).entries === 'function'
  );
}

/**
 * Resolve Next.js searchParams (Promise in v15+, plain object or
 * URLSearchParams in older/sync shapes) into a plain string record.
 * Empty/absent values are preserved as-is; callers decide significance.
 */
export async function resolveSearchParams(input: SearchParamsLike): Promise<SearchParamsRecord> {
  let v: unknown = input;
  if (v && typeof (v as Promise<unknown>).then === 'function') {
    try {
      v = await (v as Promise<unknown>);
    } catch {
      return {};
    }
  }
  if (!v) return {};
  if (isUrlSearchParamsLike(v)) {
    const out: SearchParamsRecord = {};
    for (const [k, val] of v.entries()) {
      const cur = out[k];
      if (cur === undefined) out[k] = val;
      else if (Array.isArray(cur)) cur.push(val);
      else out[k] = [cur, val];
    }
    return out;
  }
  if (typeof v === 'object') {
    const out: SearchParamsRecord = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === undefined || val === null) continue;
      out[k] = Array.isArray(val) ? val.map(String) : String(val as string | number | boolean);
    }
    return out;
  }
  return {};
}

/** First non-empty value of a param (arrays collapse to their first entry). */
export function firstValue(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v.find((x) => x !== '') ?? undefined;
  return v === '' ? undefined : v;
}

/**
 * True when the request carries at least one index-affecting query param:
 * a non-empty, non-tracking param. When `keys` is provided, ONLY those
 * keys count (tracking params never count either way); otherwise ANY
 * non-tracking non-empty param counts.
 */
export function hasIndexAffectingParams(
  params: SearchParamsRecord,
  keys?: readonly string[],
): boolean {
  for (const [k, v] of Object.entries(params)) {
    if (k.toLowerCase().startsWith('utm_')) continue;
    if (TRACKING_PARAMS.has(k.toLowerCase())) continue;
    if (keys && !keys.includes(k)) continue;
    if (firstValue(v) !== undefined) return true;
  }
  return false;
}

/** robots value for a filtered/query variant: noindex, follow (link equity preserved). */
export const ROBOTS_NOINDEX_FOLLOW = { index: false, follow: true } as const;

/** robots value for a canonical base surface: index, follow. */
export const ROBOTS_INDEX_FOLLOW = { index: true, follow: true } as const;

/**
 * Build an honest self-canonical for the current request: base URL plus the
 * request's own index-affecting params, sorted for stability, with tracking
 * params stripped. A base request (no params) canonicalizes to the bare base
 * URL; a filtered request canonicalizes to ITSELF — never to a different
 * page (no fake canonicals).
 */
export function buildSelfCanonical(baseUrl: string, params: SearchParamsRecord): string {
  const kept = Object.entries(params).filter(([k, v]) => {
    if (k.toLowerCase().startsWith('utm_')) return false;
    if (TRACKING_PARAMS.has(k.toLowerCase())) return false;
    return firstValue(v) !== undefined;
  });
  if (kept.length === 0) return baseUrl;
  kept.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const sp = new URLSearchParams();
  for (const [k, v] of kept) {
    if (Array.isArray(v)) {
      for (const x of v) if (x !== '') sp.append(k, x);
    } else if (v !== undefined && v !== '') {
      sp.append(k, v);
    }
  }
  const qs = sp.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}
