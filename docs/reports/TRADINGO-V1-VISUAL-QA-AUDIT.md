# TRADINGO V-1 Visual QA & Design System Compliance Audit

> Report generated: 2026-07-09
> Scope: All shared components, global CSS, rendered HTML of homepage/products/companies/login, source code audit

---

## 1. Executive Summary

The V-1 audit reveals a codebase in transition. The CSS variable theme system (DESIGN_D + DESIGN_W) is architecturally sound with 99/99 variable parity, but **the component layer has not been migrated**. Over 1,500 hardcoded color instances remain across components and pages, creating a critical gap between the theme foundation and the UI surface.

The **navbar** and **DesktopNavItem** components are the most mature — they use `segmentBase` constants and CSS variables correctly. Everything else — footer, company profiles, product pages, ecosystem cards, auth pages — still uses dark-mode-only hardcoded colors that will silently break in DESIGN_W.

**Verdict: 🔴 NOT PRODUCTION-READY for DESIGN_W (light theme). DESIGN_D is stable.**

---

## 2. Overall UI Score

| Category | Score | Notes |
|---|---|---|
| **DESIGN_D (Dark)** | **85/100** | Consistent, polished. Minor token leaks. |
| **DESIGN_W (Light)** | **25/100** | Critical contrast failures on most pages. |
| **Component Consistency** | **40/100** | Button component exists but isn't used. 6+ card variants. |
| **Accessibility (WCAG)** | **45/100** | 600+ text-white instances fail contrast if bg changes. |
| **Design System Compliance** | **35/100** | CSS variable system ~85% complete; component adoption ~20%. |
| **Overall** | **46/100** | Strong foundation, weak surface layer. |

---

## 3. Critical Issues (Must Fix Before Light Theme Launch)

### C-1: Footer — All 6 cards use hardcoded `#090B13` background

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **Location** | `components/shared/footer.tsx:51,86,121,156,191,237,305` |
| **Issue** | `style={{ background: '#090B13' }}` — all 6 footer cards have hardcoded dark background. In DESIGN_W, these sit on `var(--bg-base): #DBF1FD` — dark cards on light blue bg with invisible `border: rgba(255,255,255,0.06)` borders. |
| **Root Cause** | Inline style bypasses CSS variable system. Footer cards were built for single-theme dark mode. |
| **Impact** | DESIGN_W: 6 dark rectangles floating on light blue background. Card borders invisible. Social icons (line 73: `color: '#9ca7bb'` on `rgba(255,255,255,0.04)` bg) invisible. |
| **Fix** | Replace `#090B13` with `var(--bg-elevated)`. Replace `rgba(255,255,255,0.06)` borders with `var(--border-color)`. Replace `color: '#9ca7bb'` with `var(--text-secondary)`. |
| **Files** | `components/shared/footer.tsx` |

### C-2: Footer link text colors — hardcoded `#9ca7bb` + blue hover instead of accent

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **Location** | `components/shared/footer.tsx:73,105,140,175,210` |
| **Issue** | All links use `style={{ color: '#9ca7bb' }}` with JS mouseEnter/mouseLeave switching to `#3b82f6` (blue). In DESIGN_W, `#9ca7bb` on light bg has ~3.5:1 contrast ratio. Hover uses blue instead of the brand accent `#FF4D00`. |
| **Root Cause** | Legacy manual hover management. Not using Tailwind `hover:` utilities or CSS variables. |
| **Impact** | DESIGN_W: low-contrast links. Brand inconsistency (blue instead of orange accent). |
| **Fix** | Replace with `className="text-text-secondary hover:text-accent transition-colors"` |
| **Files** | `components/shared/footer.tsx` |

### C-3: Footer container — invisible border in DESIGN_W

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **Location** | `components/shared/footer.tsx:38` |
| **Issue** | `border-t border-white/[0.04]` — 4% white border on `var(--bg-base)` which in DESIGN_W is `#DBF1FD`. The separator line between page content and footer is invisible. |
| **Root Cause** | `border-white/` class always renders as white regardless of theme. |
| **Impact** | DESIGN_W: no visual separation between page body and footer. |
| **Fix** | Replace `border-white/[0.04]` with `border-border` |
| **Files** | `components/shared/footer.tsx` |

### C-4: Loading spinners — `text-white/40` on `var(--bg-base)`

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **Location** | `app/companies/loading.tsx:6`, `app/companies/page.tsx:23`, `app/products/loading.tsx`, `app/products/page.tsx` |
| **Issue** | `text-white/40` on `style={{ background: 'var(--bg-base)' }}` — in DESIGN_W, `--bg-base` is `#DBF1FD`, so `rgba(255,255,255,0.40)` on light blue = invisible text. |
| **Root Cause** | Loading states use white text on theme-aware backgrounds. |
| **Impact** | DESIGN_W: loading messages invisible. Users see a spinning animation with no text. |
| **Fix** | Replace `text-white/40` with `text-text-tertiary` |
| **Files** | `app/companies/loading.tsx`, `app/companies/page.tsx`, `app/products/loading.tsx`, `app/products/page.tsx`, and all loading.tsx files |

### C-5: Hardcoded `#0a0a0f` backgrounds throughout auth, plans, tradeserv pages

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **Location** | 80+ files including `app/(auth)/login/LoginClient.tsx:907`, `app/plans/PlansPageClient.tsx:73,79`, `app/plans/vendor/purchase/page.tsx:126,132,157,330`, `app/rfq/new/page.tsx:11`, `app/tradeserv/categories/` and `app/tradeserv/p/` |
| **Issue** | `style={{ background: '#0a0a0f' }}` — all these sections have hardcoded dark backgrounds. In DESIGN_W, these pages will have dark sections on light background. Text using `text-white` on these dark sections will be visible, but the contrast between light outer bg and dark inner sections creates visual fragmentation. |
| **Root Cause** | Auth pages, plans pages, and tradeserv pages have their own separate dark containers that bypass the theme system entirely. |
| **Impact** | DESIGN_W: fragmented theme with light/dark rectangles mixed together. |
| **Fix** | Replace with `bg-bg-elevated` or `style={{ background: 'var(--bg-elevated)' }}` |
| **Files** | 80+ files across `app/(auth)/`, `app/plans/`, `app/rfq/`, `app/tradeserv/`, `app/seller/`, `app/buyer/` |

---

## 4. High-Severity Issues

### H-1: `text-white` used on CSS-variable backgrounds throughout 600+ instances

| Field | Value |
|---|---|
| **Severity** | **HIGH** |
| **Location** | ALL components use `text-white` or `text-white/70`/`text-white/50`/`text-white/40` on surfaces that use CSS variables (`bg-bg-elevated`, `bg-surface`, `bg-surface-secondary`, `var(--bg-base)`). Key files: `app/companies/[slug]/CompanyProfileClient.tsx` (~80 uses), `app/products/[slug]/page.tsx` (~50), `app/subscription/purchase/PurchaseClient.tsx` (~80), `components/discovery/ProductCard.tsx` (~30), `components/sections/IndiaHubs.tsx` (~30). |
| **Root Cause** | `text-white` is a hardcoded color that does not change with theme. Most components were built as dark-only. |
| **Impact** | DESIGN_W: invisible or illegible text on all light surfaces. This affects virtually every page. |
| **Fix** | Replace `text-white` with `text-text-primary`, `text-white/70` with `text-text-secondary`, `text-white/50` with `text-text-tertiary` across all files. |
| **Files** | 200+ component/page files |

### H-2: `text-gray-100`/`text-gray-400` in UnifiedCard, product-card, CompanyCard, SearchBar

| Field | Value |
|---|---|
| **Severity** | **HIGH** |
| **Location** | `components/discovery/UnifiedCard.tsx` (12 uses), `components/discovery/ProductCard.tsx` (~10 uses), `components/company/CompanyCard.tsx` (~12 uses), `components/discovery/SearchBar.tsx` (~20 uses), `components/ai/` (20+ uses), `components/finance/` (7 uses), `app/admin/ai-infrastructure/page.tsx` (5 uses) |
| **Issue** | `text-gray-100` = `#f3f4f6` (near-white), readable on dark card backgrounds but invisible on light backgrounds. `text-gray-400` = `#9ca3af`, low contrast on light backgrounds. |
| **Root Cause** | Components use Tailwind v3 gray scale instead of CSS variable text tokens. |
| **Impact** | DESIGN_W: UnifiedCard uses `text-gray-100` (= `#f3f4f6`) on `compact-stack-card` hardcoded dark bg — this is fine on the dark card. But `SearchBar.tsx` uses `text-gray-400` on `var(--bg-base)` — low contrast in DESIGN_W. |
| **Fix** | Replace with `text-text-primary`, `text-text-secondary`, `text-text-tertiary` as appropriate. |
| **Files** | 30+ component files |

### H-3: Inline `rgba(255,255,255,0.XX)` borders on CSS-variable backgrounds

| Field | Value |
|---|---|
| **Severity** | **HIGH** |
| **Location** | 150+ instances across `components/discovery/`, `components/company/`, `app/companies/[slug]/`, `app/products/[slug]/`, `app/(auth)/login/`, `components/sections/` |
| **Issue** | `border: '1px solid rgba(255,255,255,0.08)'` — white borders on light backgrounds are invisible. Common in ProductCard, CompanyProfileClient, FilterSidebar, SearchBar, UnifiedCard. |
| **Root Cause** | Inline style bypasses `border-border` CSS variable class. |
| **Impact** | DESIGN_W: card borders, button borders, and container borders disappear. UI loses structure. |
| **Fix** | Replace with `style={{ border: '1px solid var(--border-color)' }}` or use `className="border-border"` |
| **Files** | 50+ component/page files |

### H-4: Button component not used — 5+ pages use inline `bg-btn-primary` (now fixed in 3, 2 remain)

| Field | Value |
|---|---|
| **Severity** | **HIGH** |
| **Location** | `app/categories/page.tsx:96`, `app/tradgo/page.tsx:76,125` (if these still exist) |
| **Issue** | Pages use `bg-btn-primary` inline instead of the shared Button component. The `bg-btn-primary` token maps to `linear-gradient()` which doesn't work as `background-color` — silently renders as transparent. |
| **Root Cause** | Inline `bg-btn-primary` bypasses the Button CVA variant system. |
| **Impact** | Both themes: buttons are invisible (transparent). Users can't click primary CTAs. |
| **Fix** | Use `<Button>...</Button>` with appropriate variant |
| **Files** | 2-5 page files |

---

## 5. Medium-Severity Issues

### M-1: `compact-stack-card` class has hardcoded dark gradient

| Field | Value |
|---|---|
| **Severity** | **MEDIUM** |
| **Location** | `globals.css:1793-1812` |
| **Issue** | `.compact-stack-card` uses `rgba(14,18,34,0.85)` / `rgba(6,8,18,0.95)` gradient background. Doesn't change in DESIGN_W. |
| **Impact** | UnifiedCard and product cards will ALWAYS be dark even in light theme. This is a deliberate design choice but breaks theme consistency. |
| **Fix** | Either make it a design feature (document as "dark card" pattern) or replace with CSS variables. |

### M-2: Auth layout hardcodes `#0a0a0f` container

| Field | Value |
|---|---|
| **Severity** | **MEDIUM** |
| **Location** | `app/(auth)/login/LoginClient.tsx:907` (outer container) |
| **Issue** | The entire login page has `background: #0a0a0f` with all content using `text-white`. This means the auth layout is permanently dark — DESIGN_W cannot affect it. |
| **Impact** | Theme switching is broken for auth pages. User who prefers light mode gets dark login. |
| **Fix** | Remove hardcoded `#0a0a0f`, use `--bg-base` or `--bg-elevated` instead. |

### M-3: `border-white/10 bg-surface-secondary` in CTA pill badges

| Field | Value |
|---|---|
| **Severity** | **MEDIUM** |
| **Location** | `app/page.tsx:67` (rendered as `border-white/10 bg-surface-secondary` in the CTA pill badges) |
| **Issue** | `border-white/10` = invisible on DESIGN_W bg. `bg-surface-secondary` = `#F8FAFC` (fine). |
| **Impact** | DESIGN_W: pill borders invisible. Pills look flat. |
| **Fix** | Replace `border-white/10` with `border-border` |

### M-4: `from-white via-gray-200 to-gray-400` gradient text in CTA section

| Field | Value |
|---|---|
| **Severity** | **MEDIUM** |
| **Location** | CTA section (RSC payload line 56-67) |
| **Issue** | `bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent` — gradient from white to gray. On DESIGN_W light bg, the `from-white` blends into background. `via-gray-200` and `to-gray-400` = `#E5E7EB`, `#9CA3AF` on light bg = low contrast/loss of visual impact. |
| **Impact** | DESIGN_W: gradient text effect is barely visible. |
| **Fix** | Use `var(--text-primary)`-based gradient or accent-based gradient. |

### M-5: `text-green-400`, `text-blue-400`, hardcoded accent colors throughout

| Field | Value |
|---|---|
| **Severity** | **MEDIUM** |
| **Location** | `app/register/vendor/steps/`, `app/plans/`, `app/tradeserv/` |
| **Issue** | `text-green-400`, `text-blue-400`, `text-[#FF7A33]`, `text-[#F2C94C]` are hardcoded Tailwind/reserved colors that don't respect the design token system. These are used for status indicators, feature badges, and decorative text. |
| **Impact** | DESIGN_W: these colors may still be visible (green/blue/amber are distinct) but violate token system consistency. |
| **Fix** | Replace with `text-status-success`, `text-status-info`, `text-accent-500`, `text-accent-gold` |

---

## 6. Design System Compliance Detail

### Token Categories

| Token Category | Exists in CSS | Component Adoption |
|---|---|---|
| `--color-text-*` | ✅ 5 tokens | ~25% (navbar uses them; 600+ text-white instances ignore them) |
| `--color-bg-*` | ✅ 4 tokens | ~30% (layout containers use `var(--bg-elevated)`; auth/plans/footer ignore) |
| `--color-surface-*` | ✅ 3 tokens | ~40% (cards mostly use these; `#090B13` footer cards ignore) |
| `--color-border` | ✅ 1 token | ~35% (150+ inline rgba borders ignore) |
| `--color-accent-*` | ✅ 8 tokens | ~50% (gradient buttons use it; inline `color: '#3b82f6'` ignores) |
| `--color-btn-*` | ✅ 4 tokens | ~40% (Button CVA uses; inline `bg-btn-primary` broken) |
| `--color-glass-*` | ✅ 11 tokens | ~20% |
| `--color-shadow-*` | ✅ 4 tokens | ~10% (most use hardcoded shadow values) |
| `--color-status-*` | ✅ 4 tokens | ~10% (most use `text-green-400`, `text-red-500` etc.) |
| `--color-nav-*` | ✅ 6 tokens | ~0% |
| `--color-sidebar-*` | ✅ 5 tokens | ~0% |
| `--color-input-*` | ✅ 6 tokens | ~30% |

### Shared Component Audit

| Component | Uses Design System Tokens | Uses CVA/Shared Component | Notes |
|---|---|---|---|
| **Button** | ✅ | ✅ (Self) | Default variant uses gradient tokens correctly |
| **Navbar** | ✅ Partial | ✅ (Self) | TopBar, MobileNav, MobileHome now fixed. Desktop nav items still use `text-white/*` on dark capsule (acceptable). |
| **Footer** | ❌ | ❌ | 6 cards use hardcoded `#090B13`. Links use `#9ca7bb`. Hover uses `#3b82f6` instead of accent. |
| **UnifiedCard** | ❌ | ❌ | Hardcoded dark gradient (`compact-stack-card`). Uses `text-gray-100`/`text-gray-400`. |
| **ProductCard** | ❌ | ❌ | 30+ inline hardcoded colors, borders, and text. |
| **CompanyCard** | ❌ | ❌ | 12+ inline hardcoded colors and rgba borders. |
| **SearchBar** | ❌ | ❌ | 20+ hardcoded `text-gray-XX` and `rgba` borders. |
| **Ecosystem Cards** | ❌ | ❌ | `bg-white/80`, `bg-white/90` — invisible on DESIGN_W. |
| **Statistics Cards** | ❌ | ❌ | `bg-white/80` — invisible on DESIGN_W. |
| **Drawer** | ❌ | ❌ | `bg-white/[0.06]`, `text-white` on transparent dark bg. |
| **Modal** | ❌ | ❌ | Same pattern as Drawer. |
| **Tabs** | ❌ | ❌ | `bg-white/[0.04]`, `text-white`. |
| **Accordion** | ❌ | ❌ | `bg-white/[0.02]`, `text-white`. |
| **Table** | ❌ | ❌ | `bg-white/[0.04]`. |

---

## 7. Component-Specific Findings

### Footer (`components/shared/footer.tsx`)
- **3 critical, 1 high issue**
- All 6 cards: `background: '#090B13'` → must use `var(--bg-elevated)`
- All links: `color: '#9ca7bb'` → must use `text-text-secondary hover:text-accent`
- Social icons: `rgba(255,255,255,0.04)` bg → must use `bg-surface-secondary`
- Container border: `border-white/[0.04]` → must use `border-border`
- Estimated: **1 file, 150 lines changed**

### Navbar (`components/shared/navbar.tsx`)
- **3 high, 1 medium issue** — partially fixed in this session
- TopBar: ✅ FIXED (all `text-white/*` → `text-text-*`, borders → `border-border`)
- MobileNavItem: ✅ FIXED (borders, text tokens)
- MobileHomeItem: ✅ FIXED (borders, text tokens)
- Desktop nav items: still uses `text-white/70` on dark capsule — intentional (capsule is always dark)
- `themeToggleClass`: still uses `text-white/70` — only used on dark capsule/mobile drawer bottom bar (fixed mobile version)
- Focus ring offsets: ✅ FIXED (`#111111` → `bg-base`)

### Button (`components/ui/button.tsx`)
- ✅ CVA structure correct
- ✅ Default variant uses gradient (was `bg-btn-primary`, now `bg-gradient-to-br from-accent-500 to-accent-400`)
- ❌ `destructive` variant uses `bg-red-600` (should use `bg-status-error`)
- ❌ `accent` variant uses `bg-accent-600` (no `--accent-600` exists, uses fallback)
- ❌ `link` variant uses `text-primary-600` (no `--primary-600` token)

### Auth Pages (`app/(auth)/`)
- **Critical issue**: Entire auth layout is hardcoded `#0a0a0f` dark
- `LoginClient.tsx`: 50+ `text-white`/`text-white/XX` instances on dark bg (ok in DESIGN_D, broken in DESIGN_W if container bg is fixed)
- `forgot-password/page.tsx`: 25+ `text-white` instances

### Product Pages (`app/products/[slug]/page.tsx`)
- 50+ inline hardcoded colors and borders
- Heavy `rgba(255,255,255,0.06/0.07/0.08/0.09)` border usage
- Multiple `color: '#f59e0b'` and `color: '#F2C94C'` inline styles

### Company Profile (`app/companies/[slug]/CompanyProfileClient.tsx`)
- ~80 inline style blocks with hardcoded colors
- The most heavily affected single page

### Plans Pages (`app/plans/`)
- Hardcoded `#0A0A0F` backgrounds on all plan cards
- Heavy `text-white` usage
- Inline `color: '#fff'` on buttons

---

## 8. Recommended Fix Order

| Phase | Focus | Issues | Est. Files | Est. Time | Priority |
|---|---|---|---|---|---|
| **V-2A** | Footer redesign | C-1, C-2, C-3 | 1 | 2h | HIGHEST |
| **V-2B** | Loading states + spinners | C-4 | 10-15 | 1h | HIGHEST |
| **V-2C** | Hardcoded `#0a0a0f` containers | C-5 | 80 | 4h | HIGH |
| **V-2D** | text-white → text-text-* routing | H-1 | 200 | 8h | HIGH |
| **V-2E** | rgba borders → border-border | H-3 | 50 | 3h | HIGH |
| **V-2F** | text-gray-* → text-text-* | H-2 | 30 | 2h | MEDIUM |
| **V-2G** | Remaining bg-btn-primary pages | H-4 | 2-5 | 0.5h | MEDIUM |
| **V-2H** | Auth layout theme adoption | M-2 | 5 | 2h | MEDIUM |
| **V-2I** | Ecosystem cards bg-white/XX | M-3 | 15 | 1h | LOW |
| **V-2J** | All remaining token migration | M-1,M-4,M-5 | 200+ | 16h | LOW |

---

## 9. Estimated Files & Time

| Metric | Estimate |
|---|---|
| **Total files affected** | ~250 files |
| **Total inline/style changes** | ~1,500+ |
| **Estimated engineering time** | 40-60 hours (1-2 weeks for a team) |
| **Design review time** | 8 hours |
| **QA verification time** | 16 hours |

---

## 10. Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| **DESIGN_W full fix regresses DESIGN_D** | **HIGH** | Every change must be verified in both themes. CSS variables correctly inherit different values per theme — low risk IF tokens are correctly mapped. |
| **Scope creep ~250 files** | **HIGH** | Need strict per-phase boundaries. V-2A through V-2J must not expand. |
| **text-white used intentionally on dark sections** | **MEDIUM** | Some `text-white` on hardcoded dark backgrounds is valid. The audit must verify context for each of 600+ instances. |
| **Inline styles harder to find** | **MEDIUM** | Pattern 3-5 (inline style props) are harder to grep than CSS classes. Automated tooling needed. |
| **Regression in button gradient fix** | **LOW** | `bg-gradient-to-br from-accent-500 to-accent-400` confirms working in both themes. |

---

## 11. Final Recommendation

1. **Do NOT ship DESIGN_W as default.** The light theme has critical contrast failures on every page.
2. **Keep DESIGN_D as default.** It is stable and visually complete.
3. **Start with V-2A (Footer).** 1 file, highest impact visibility for DESIGN_W.
4. **Use automated approach for V-2D.** 200 files × `text-white` → `text-text-primary` needs sed/regex, not manual editing.
5. **Audit auth pages separately.** The `(auth)` route group has its own layout with different providers. Theme switching there requires independent verification.
6. **After V-2A through V-2E is complete, run full UAT** in both themes before proceeding to V-2F through V-2J.
7. **Target: 3 weeks** for full remediation with 2 developers.

---

*End of audit. No code has been modified.*
