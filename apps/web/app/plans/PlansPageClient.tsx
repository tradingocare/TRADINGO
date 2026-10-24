'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '../../lib/api/client'
import { useAuthStore } from '../../store/auth-store'
import { CheckCircle2, X, Sparkles, ArrowRight, Info, Rocket, Star, Zap, Crown } from 'lucide-react'

interface Plan {
  id: string; planId: string; name: string; description: string
  pricePlanA: number; pricePlanB: number; pricePlanC: number
  duration: number; isFree: boolean; badgeText: string | null
  features: string[]; sortOrder: number; visibility: string
  metadata?: any
}

// P1 six-plan grid: the six canonical commercial plans, in matrix order.
// Sourced from the canonical GET /membership/plans read path (active PUBLIC
// rows); the launch endpoint remains the promo-only source below. Exported
// for unit tests.
export const COMMERCIAL_PLAN_IDS = [
  'trade_start',
  'trade_smart',
  'trade_plus',
  'trade_pro',
  'trade_premium',
  'trade_elite',
]

// Canonical TRAD UP plan identifier (free launch offer). Seller-first:
// guests enter /register/vendor with this context; the vendor wizard admits
// it as an explicit selection and the fulfillment path activates it via
// activateFreePlan (never enrollTrial).
export const TRAD_UP_PLAN_ID = 'trad-up'

export function splitCommercialPlans(list: Plan[]): Plan[] {
  const byId = new Map(list.map((p) => [p.planId, p]))
  return COMMERCIAL_PLAN_IDS
    .map((id) => byId.get(id))
    .filter((p): p is Plan => !!p)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

// Tier labels follow the Founder-approved reference
// (tradingo_registration_refined.html: PLAN A — GO Offer Year,
// PLAN B — Launch Year, PLAN C — Annual Plan) and the server tier
// selection (pricePlanA/B/C). Prices render verbatim from the API.
const PRICE_TIERS = [
  { key: 'pricePlanA', label: 'GO Offer Year' },
  { key: 'pricePlanB', label: 'Launch Year' },
  { key: 'pricePlanC', label: 'Annual Plan' },
] as const

interface MatrixRow {
  key: string; title: string; values: [string, string, string, string, string, string]
}

interface ComparisonMatrix {
  plans: string[]; rows: MatrixRow[]
}

/** Session-level GET cache for near-static plan reads. Dev StrictMode
 * double-effects, HMR remounts and concurrent sections reuse one in-flight
 * request instead of hammering the tight membership throttle bucket
 * (public reads share 10 req/min). Successes only — failures evict so a
 * later remount can recover. */
const plansResponseCache = new Map<string, Promise<any>>();

export function cachedPlansGet(get: (url: string) => Promise<any>, url: string): Promise<any> {
  const hit = plansResponseCache.get(url);
  if (hit) return hit;
  const p = get(url).then(
    (r) => r,
    (err) => {
      plansResponseCache.delete(url);
      throw err;
    },
  );
  plansResponseCache.set(url, p);
  return p;
}

export function clearPlansCache(): void {
  plansResponseCache.clear();
}

/** GET with one retry: the local/API process restarts (watch rebuilds,
 * deploys) turn in-flight fetches into refusals, which the offline worker
 * surfaces as synthetic 503s. A single delayed retry rides out the window.
 * Retries ONLY network failures (no response) and 5xx — never 429/4xx, since
 * the membership read endpoints share a tight throttle bucket and an
 * immediate retry would deepen the limit. Resolves null when both attempts
 * fail (caller hides optional UI). */
function isRetriable(err: any): boolean {
  const status = err?.response?.status
  if (status === undefined || status === null) return true
  return status >= 500
}

export async function fetchJsonWithRetry(
  get: (url: string) => Promise<any>,
  url: string,
  retries = 1,
  delayMs = 600,
): Promise<any | null> {
  try {
    const r = await get(url)
    return r?.data?.data ?? r?.data ?? r ?? null
  } catch (first) {
    if (retries <= 0 || !isRetriable(first)) {
      console.warn(`[plans] ${url} failed (no retry)`, first)
      return null
    }
    await new Promise((res) => setTimeout(res, delayMs))
    try {
      const r = await get(url)
      return r?.data?.data ?? r?.data ?? r ?? null
    } catch (second) {
      console.warn(`[plans] ${url} failed after retry`, second)
      return null
    }
  }
}
/** TRAD UP column for the unified comparison (same table, same style).
 * Grounded ONLY in the TRAD UP plan record itself (features[] + metadata);
 * every unmapped/unknown row yields '—' (not published) — never fabricated.
 * Unknown future matrix keys also fall to '—' by construction. */
export function tradUpCells(tradUp: Plan | null | undefined, rows: MatrixRow[]): string[] {
  const feats: string[] = Array.isArray(tradUp?.features) ? tradUp!.features.map(String) : [];
  const has = (re: RegExp) => feats.some((f) => re.test(f));
  const byFeature: Record<string, RegExp> = {
    chat_level: /chat/i,
    rfq_monthly_limit: /rfq/i,
    direct_orders: /order/i,
    business_profile: /business profile/i,
    search_rank_tier: /search visibility/i,
  };
  return rows.map((r) => {
    if (!tradUp) return '—';
    if (r.key === 'product_listings_limit') {
      const n = tradUp.metadata?.maxProducts;
      return n !== null && n !== undefined && n !== '' ? String(n) : '—';
    }
    const re = byFeature[r.key];
    return re ? (has(re) ? '✓' : '—') : '—';
  });
}

// TRAD UP term display (founder-locked 90-day default). The SERVER is canonical
// (metadata.durationDays override, else 90 — see MembershipService); this is a
// display-only fallback for rows predating the metadata field.
export const TRAD_UP_DEFAULT_DURATION_DAYS = 90

export function tradUpDurationDays(tradUp: Plan | null | undefined): number {
  const raw = tradUp?.metadata?.durationDays
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 3650
    ? (n as number)
    : TRAD_UP_DEFAULT_DURATION_DAYS
}
/** Shared comparison cell idiom (✓/✗ icons, otherwise verbatim text). */
export function CompareCell({ value, checkClass }: { value: string; checkClass?: string }) {
  if (value === '✓') return <CheckCircle2 size={14} className={`mx-auto ${checkClass ?? 'text-green-400'}`} />;
  if (value === '✗') return <X size={14} className="mx-auto text-text-tertiary" />;
  return <span className="text-text-tertiary text-xs">{value}</span>;
}
/** Card bullets derived ONLY from canonical matrix display rows
 * (`value + title`, e.g. "75 Product Listings"). Benefits a plan does not
 * include ('none'/'no') and bare flags ('yes') are skipped — never shown as
 * claims, never sourced from legacy display copy. */
const SKIPPED_BULLET_VALUES = new Set(['none', 'no', 'yes']);

export function planBullets(rows: MatrixRow[], planIndex: number): string[] {
  return rows
    .filter((r) => {
      const v = (r.values[planIndex] ?? '').trim().toLowerCase();
      return v.length > 0 && !SKIPPED_BULLET_VALUES.has(v);
    })
    .map((r) => `${r.values[planIndex]} ${r.title}`);
}

/** Join matrix rows with commercial plan names (fallback: pretty planId). */
export function joinComparisonRows(matrix: ComparisonMatrix | null): { key: string; title: string; cells: string[] }[] {
  if (!matrix) return []
  return matrix.rows.map((row) => ({ key: row.key, title: row.title, cells: [...row.values] }))
}

export function planDisplayName(planId: string, plans: Plan[]): string {
  const found = plans.find((p) => p.planId === planId)
  if (found?.name) return found.name
  return planId.replace(/^trade_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// P2B single-selection model: exactly one commercial plan + one package tier.
// Pure helpers so selection/price/CTA context is unit-testable; the tier
// default is explicit ('A') and always rendered — never silent.
export const PLAN_TIERS = ['A', 'B', 'C'] as const
export type PlanTierId = (typeof PLAN_TIERS)[number]

const TIER_PRICE_KEY: Record<PlanTierId, 'pricePlanA' | 'pricePlanB' | 'pricePlanC'> = {
  A: 'pricePlanA', B: 'pricePlanB', C: 'pricePlanC',
}

export function parseTierId(v: string | null | undefined): PlanTierId {
  const t = (v || '').toUpperCase()
  return t === 'B' || t === 'C' ? t : 'A'
}

export function priceForTier(plan: Plan, tier: PlanTierId): number {
  return plan[TIER_PRICE_KEY[tier]]
}

/** R3C-R1A canonical routing: commercial CTAs go DIRECTLY to the GoLive
 * seller registration page (/register/vendor) — no login/golive intermediate.
 * The wizard itself handles guest account creation + OTP; logged-in buyers
 * are bounced to onboarding with context preserved (entry gate); sellers
 * keep the existing purchase/upgrade flow so no duplicate company is created.
 * Authenticated/role branches:
 * - guest/buyer/staff → /register/vendor?planId=&tier= (guest-safe: the page
 *   and middleware allow unauthenticated loads; logged-in roles are routed
 *   by the entry gate, hints preserved for /register/* targets)
 * - seller → existing purchase/upgrade flow with tier preserved. */
export type PlanCtaRole = 'guest' | 'buyer' | 'seller' | 'staff';

export function planCtaRole(user: { role?: string } | null | undefined): PlanCtaRole {
  const r = user?.role;
  if (!r) return 'guest';
  if (r === 'SELLER') return 'seller';
  if (r === 'ADMIN' || r === 'SUPER_ADMIN') return 'staff';
  return 'buyer';
}

/** CTA target preserving plan+tier context (R3C-R1A: direct vendor entry). */
export function buildPlanCta(planId: string, tier: PlanTierId, user: { role?: string } | null | undefined): string {
  // TRAD UP seller-first: guests enter canonical vendor registration with
  // trad-up context (the wizard admits + fulfills it via activateFreePlan).
  // Authenticated users keep the direct purchase path (existing behavior).
  // Other promo plans keep the pre-existing purchase-first path verbatim.
  if (planId === TRAD_UP_PLAN_ID && !user?.role) {
    return `/register/vendor?planId=${TRAD_UP_PLAN_ID}`;
  }
  if (!(COMMERCIAL_PLAN_IDS as readonly string[]).includes(planId)) {
    const qs = `/subscription/purchase?planId=${planId}`;
    return user?.role ? qs : `/login?next=${encodeURIComponent(qs)}`;
  }
  if (planCtaRole(user) === 'seller') return `/subscription/purchase?planId=${planId}&tier=${tier}`;
  return `/register/vendor?planId=${planId}&tier=${tier}`;
}

interface CommercialPlanCardProps {
  plan: Plan;
  tier: PlanTierId;
  selected: boolean;
  bullets: string[];
  onSelect: (planId: string) => void;
  onChoose: (planId: string, tier: PlanTierId) => void;
}

/** One reusable commercial plan card (Part 1C): single headline price that
 * always follows the selected package — never a silent tier (Part 1D/1E).
 * Structure mirrors the launch-offer cards (badge, icon, name, tagline, big
 * price + suffix, subline, CTA); gold accent keeps commercial separate from
 * the blue promo (K1). No feature bullets: stored per-plan copy predates the
 * matrix and would misstate allowances (P1 gap H). */
const PLAN_ICONS: Record<string, typeof Star> = {
  trade_start: Star,
  trade_smart: Zap,
  trade_plus: Zap,
  trade_pro: Crown,
  trade_premium: Crown,
  trade_elite: Crown,
}

const TIER_SUFFIX: Record<PlanTierId, string> = { A: '/year', B: '/2 years', C: '/3 years' }

/** Billing horizon follows the purchase-tier contract (A=12mo, B=2yr, C=3yr). */
export function tierBilling(tier: PlanTierId): string {
  return tier === 'A' ? '12-month billing' : tier === 'B' ? '2-year billing' : '3-year billing'
}

export function CommercialPlanCard({ plan, tier, selected, bullets, onSelect, onChoose }: CommercialPlanCardProps) {
  const tierLabel = PRICE_TIERS.find((p) => p.key === TIER_PRICE_KEY[tier])?.label ?? tier
  const Icon = PLAN_ICONS[plan.planId] ?? Star
  return (
    <div
      onClick={() => onSelect(plan.planId)}
      aria-pressed={selected}
      className="relative rounded-2xl p-6 transition-all duration-300 flex flex-col border cursor-pointer"
      style={{
        background: 'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(245,158,11,0.02))',
        borderColor: selected ? '#f59e0b' : 'rgba(245,158,11,0.25)',
        boxShadow: selected ? '0 0 24px rgba(245,158,11,0.25)' : 'none',
      }}>
      {(selected || plan.badgeText) && (
        <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
          {selected && <CheckCircle2 size={10} />}
          {selected ? 'Selected' : plan.badgeText}
        </div>
      )}
      <Icon size={28} style={{ color: '#f59e0b' }} className="mb-3" />
      <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
      <p className="text-white/40 text-xs mb-4">{plan.description}</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-white font-black text-4xl">{formatPrice(priceForTier(plan, tier))}</span>
        <span className="text-white/30 text-xs">{TIER_SUFFIX[tier]}</span>
      </div>
      <p className="text-white/30 text-xs mb-5">PLAN {tier} — {tierLabel} • {tierBilling(tier)}</p>
      {bullets.length > 0 && (
        <ul className="space-y-2 mb-6 flex-1">
          {bullets.slice(0, 8).map((b, bi) => (
            <li key={bi} className="flex items-center gap-2 text-white/50 text-xs">
              <CheckCircle2 size={12} className="text-orange-400 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
        onClick={(e) => { e.stopPropagation(); onSelect(plan.planId); onChoose(plan.planId, tier) }}
        className="w-full py-3.5 rounded-xl font-bold text-sm mt-auto"
        style={{
          background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
          color: '#fff',
        }}>
        Choose {plan.name} — {formatPrice(priceForTier(plan, tier))} <ArrowRight size={14} className="inline ml-1" />
      </motion.button>
    </div>
  )
}

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN')

export default function PlansPageClient() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [commercialPlans, setCommercialPlans] = useState<Plan[]>([])
  const [matrix, setMatrix] = useState<ComparisonMatrix | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('trade_start')
  const [selectedTier, setSelectedTier] = useState<PlanTierId>('A')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      cachedPlansGet((u) => api.get(u), '/membership/plans/launch').then((r: any) => r.data?.data || r.data || r),
      // Canonical read path for the six commercial plans (active PUBLIC rows).
      // The launch-only endpoint is NOT the source for the commercial grid.
      cachedPlansGet((u) => api.get(u), '/membership/plans').then((r: any) => r.data?.data || r.data || r),
    ])
      .then(([launch, all]) => {
        if (cancelled) return
        const launchList = Array.isArray(launch) ? launch : []
        const allList = Array.isArray(all) ? all : []
        setPlans(launchList)
        setCommercialPlans(splitCommercialPlans(allList))
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load plans')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    // Canonical entitlement comparison (P2A). Failure hides the table only —
    // the plan grid above never depends on it. One retry rides out API
    // restart windows (refusals surface as synthetic 503s via the SW).
    fetchJsonWithRetry((u) => cachedPlansGet((u2) => api.get(u2), u), '/membership/entitlement-matrix')
      .then((d) => {
        if (cancelled || !d) return
        if (Array.isArray(d.plans) && Array.isArray(d.rows)) setMatrix(d)
      })
    return () => { cancelled = true }
  }, [])

  const tradUpPlan = plans.find(p => p.planId === 'trad-up')

  const handleChoose = (planId: string, tier: PlanTierId = selectedTier) => {
    router.push(buildPlanCta(planId, tier, user))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-base)' }}>
      <div className="w-12 h-12 rounded-full border-2 border-t-[#f59e0b] border-border animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background:'var(--bg-base)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#3D8BFF20,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background:'radial-gradient(circle,#f59e0b18,transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Launch Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{
              background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
              color: '#fff',
            }}>
            <Sparkles size={14} /> Launch Offer — Limited Time
          </span>
        </div>

        <div className="text-center mb-10">
          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="text-white font-black text-3xl sm:text-5xl mb-3">
            Start Your <span style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>TRADINGO</span> Journey
          </motion.h1>
          <p className="text-white/40 text-sm max-w-2xl mx-auto">
            Join India&apos;s fastest growing B2B marketplace. Choose from six commercial plans designed to help your business grow — plus a free launch offer.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}

        {/* Commercial plans — six canonical plans from GET /membership/plans.
            Cards render ONLY canonical scalar fields (name, tier prices,
            duration). Feature bullets are intentionally omitted: the stored
            per-plan `features` copy predates the commercial matrix and would
            misstate listings/RFQ allowances. CTA routing unchanged (P2). */}
        {commercialPlans.length > 0 && (
          <div className="mb-12">
            <h2 className="text-white font-bold text-xl text-center mb-2">Commercial Plans</h2>
            <p className="text-white/40 text-xs text-center mb-6">Select a plan, then a package — the price always follows your selection.</p>
            {/* Package selector: one tier, explicit, always visible (P2B) */}
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap" role="group" aria-label="Package">
              {PLAN_TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTier(t)}
                  aria-pressed={selectedTier === t}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedTier === t
                      ? 'text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                  style={selectedTier === t
                    ? { background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', borderColor: 'transparent' }
                    : { background: 'transparent', borderColor: 'var(--border-color)' }}
                >
                  PLAN {t} — {PRICE_TIERS.find((p) => p.key === TIER_PRICE_KEY[t])?.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {commercialPlans.map((plan) => (
                <CommercialPlanCard
                  key={plan.planId}
                  plan={plan}
                  tier={selectedTier}
                  selected={selectedPlan === plan.planId}
                  bullets={matrix ? planBullets(matrix.rows, matrix.plans.indexOf(plan.planId)) : []}
                  onSelect={setSelectedPlan}
                  onChoose={(planId, tier) => handleChoose(planId, tier)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Free promotional offer — launch plans, kept separate (K1) */}
        <h2 className="text-white font-bold text-xl text-center mb-6">Free Launch Offer</h2>
        <div className="grid grid-cols-1 gap-6 mb-12 max-w-md mx-auto">
          {/* TRAD UP™ Card */}
          {tradUpPlan && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              className="relative rounded-2xl p-6 transition-all duration-300 flex flex-col border"
              style={{
                background: 'linear-gradient(135deg,rgba(61,139,255,0.06),rgba(61,139,255,0.02))',
                borderColor: 'rgba(61,139,255,0.25)',
              }}>
              <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3D8BFF,#6BA8FF)' }}>
                Launch Offer
              </div>
              <Rocket size={28} style={{ color: '#3D8BFF' }} className="mb-3" />
              <h3 className="text-white font-bold text-xl mb-1">TRAD UP™</h3>
              <p className="text-white/40 text-xs mb-4">Launch Membership — Start selling with zero investment</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-white font-black text-4xl">₹0</span>
              </div>
              <p className="text-white/30 text-xs mb-5">Valid for {tradUpDurationDays(tradUpPlan)} days • No credit card required</p>
              <ul className="space-y-2 mb-6 flex-1">
                {(tradUpPlan.features as string[]).slice(0, 8).map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-white/50 text-xs">
                    <CheckCircle2 size={12} className="text-blue-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={() => handleChoose('trad-up')}
                className="w-full py-3.5 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg,#3D8BFF,#6BA8FF)',
                  color: '#fff',
                }}>
                Get Started Free <ArrowRight size={14} className="inline ml-1" />
              </motion.button>
            </motion.div>
          )}

          {/* Trade Smart launch card removed (P2 deduplication): the commercial
              Trade Smart card above is the single Smart surface (same Plan A
              price). TRAD UP stays solo as the free offer. */}
        </div>

        {/* Unified Feature Comparison — ONE table, same style: TRAD UP™
            (grounded in its own plan record, '—' where unpublished) plus all
            six commercial plans (verbatim canonical matrix values). */}
        {matrix && matrix.rows.length > 0 && (tradUpPlan || commercialPlans.length > 0) && (
          <div className="rounded-2xl overflow-hidden border border-border bg-surface max-w-6xl mx-auto">
            <div className="p-6 border-b border-border flex items-center gap-2">
              <Info size={16} className="text-text-tertiary" />
              <h2 className="text-text-primary font-bold text-lg">Feature Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-4 text-text-tertiary text-xs font-semibold">Feature</th>
                    {tradUpPlan && (
                      <th className="px-4 py-4 text-blue-400 text-xs font-bold text-center whitespace-nowrap">TRAD UP™</th>
                    )}
                    {matrix.plans.map((planId) => (
                      <th key={planId} className="px-4 py-4 text-orange-400 text-xs font-bold text-center whitespace-nowrap">
                        {planDisplayName(planId, commercialPlans)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const tradCells = tradUpCells(tradUpPlan ?? null, matrix.rows);
                    return joinComparisonRows(matrix).map((row, ri) => (
                      <tr key={row.key} className="border-b border-border">
                        <td className="px-6 py-3 text-text-secondary text-xs">{row.title}</td>
                        {tradUpPlan && (
                          <td className="px-4 py-3 text-center">
                            <CompareCell value={tradCells[ri]} checkClass="text-blue-400" />
                          </td>
                        )}
                        {row.cells.map((cell, ci) => (
                          <td key={ci} className="px-4 py-3 text-center">
                            <CompareCell value={cell} />
                          </td>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            <p className="px-6 py-3 text-text-tertiary text-[10px]">— = not published for the free TRAD UP™ plan.</p>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-text-tertiary text-xs">
            All plans include GST invoice. Prices are in INR. TRAD UP™ auto-expires after {tradUpDurationDays(tradUpPlan)} days.
          </p>
        </div>
      </div>
    </div>
  )
}
