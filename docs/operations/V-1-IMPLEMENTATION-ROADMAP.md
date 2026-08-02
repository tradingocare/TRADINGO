# V-1 Visual QA — Implementation Roadmap

> Reorganized from `TRADINGO-V1-VISUAL-QA-AUDIT.md` into architectural work packages.
> Zero code changes. Execution plan only.

---

## 1. Quick Wins — Highest ROI per File

These 3 packages cover 4 files and fix the most visible DESIGN_W failures with minimal effort.

| # | Package | Files | Est. | DESIGN_W Impact |
|---|---|---|---|---|
| **QW-1** | Footer token migration | 1 | 2h | 6 dark rectangles on light bg → theme-consistent cards |
| **QW-2** | Loading states | ~12 | 1h | Invisible spinner text → readable "Loading..." in both themes |
| **QW-3** | Data table + UI primitives | 6 | 1.5h | Drawer/Modal/Tabs/Table invisible borders + white text → theme-aware |

**Total QW: ~19 files, 4.5h → fixes 80% of visible DESIGN_W breakage**

---

## 2. Architectural Work Packages

### Package A — Shared Layout (Footer + Navbar)

| Field | Value |
|---|---|
| **Components** | Footer (1 file), Navbar (1 file) |
| **Files** | `components/shared/footer.tsx`, `components/shared/navbar.tsx` |
| **Audit issues** | C-1, C-2, C-3 (Footer), 3 previously-fixed navbar items |
| **Total hardcoded instances** | ~30 inline style props, ~20 text-white classes |
| **Fix scope** | Footer: replace `#090B13` → `var(--bg-elevated)`, `#9ca7bb` → `text-text-secondary`, `rgba(255,255,255,0.06)` borders → `border-border`, JS hover handlers → Tailwind `hover:` utilities, blue hover → accent hover. Navbar: already partially fixed, verify remaining DesktopNavItem `text-white/70` on dark capsule (intentional). |
| **Effort** | 2h |
| **Risk** | Low. 1 file, no dependencies. Inline styles are self-contained. |
| **Priority** | **P0 — Before any light theme testing** |
| **Expected improvement** | DESIGN_W: footer becomes cohesive with rest of page. Light-appropriate card backgrounds, visible borders, readable links. |

### Package B — Button System

| Field | Value |
|---|---|
| **Components** | Shared `Button` CVA, all pages that bypass it |
| **Files** | `components/ui/button.tsx` (1), page files using `bg-btn-primary` inline (~5) |
| **Audit issues** | H-4 (5 pages bypassing Button), token gaps in Button variants |
| **Total hardcoded instances** | 5 `bg-btn-primary` inline usages, 3 variant token gaps |
| **Fix scope** | **(A) Fix Button CVA variants**: `destructive` variant uses `bg-red-600` → should use `bg-status-error`, `accent` variant uses `bg-accent-600` (undefined) → should use `bg-accent-500`, `link` variant uses `text-primary-600` (undefined) → should use `text-accent`. **(B) Migrate bypassing pages**: replace inline `bg-btn-primary` with `<Button variant="default">` in the ~5 remaining pages. |
| **Effort** | 1h |
| **Risk** | Low. Button CVA is standalone. Page migrations are mechanical. |
| **Priority** | **P0** |
| **Expected improvement** | Both themes: all primary CTAs render correctly with gradient backgrounds. No more invisible buttons. |

### Package C — Card System

| Field | Value |
|---|---|
| **Components** | UnifiedCard, ProductCard, ProductCardSkeleton, CompanyCard, CompanyCardSkeleton, compact-product-card, stat-card, statistics-cards, ecosystem cards (badge-card, achievement-card, xp-progress-bar, mission-card, streak-calendar, reward-timeline, reward-statistics, reward-summary) |
| **Files** | ~15 component files |
| **Audit issues** | H-1 (text-white), H-2 (text-gray-*), H-3 (rgba borders), M-1 (compact-stack-card hardcoded gradient), + ecosystem `bg-white/80`/`bg-white/90` patterns |
| **Total hardcoded instances** | ~100 text-white, ~60 text-gray-*, ~50 rgba borders, ~15 bg-white/XX |
| **Fix scope** | **(A) Token replacements**: `text-white/*` → `text-text-*`, `text-gray-*` → `text-text-*`, `rgba(255,255,255,0.XX)` borders → `border-border`. **(B) Ecosystem**: `bg-white/80` → `bg-surface` or `bg-surface-secondary`. **(C) compact-stack-card**: either document as deliberate "always dark" card pattern or replace gradient with CSS variables. |
| **Effort** | 4h |
| **Risk** | Medium. Cards have multiple visual states (hover, active, loading). Each token change must be verified in both themes. `compact-stack-card` decision needs design sign-off. |
| **Priority** | **P1** |
| **Expected improvement** | DESIGN_W: cards get visible borders, readable text, light-appropriate backgrounds. DESIGN_D: unchanged (tokens resolve to same or near-identical values). |

### Package D — Shared Layout Container (Auth + Plans + Subscription)

| Field | Value |
|---|---|
| **Components** | Auth layout (`(auth)` route group), Plans pages, Subscription pages |
| **Files** | ~20 files across `app/(auth)/`, `app/plans/`, `app/subscription/` |
| **Audit issues** | C-5 (hardcoded `#0a0a0f` backgrounds), M-2 (auth layout permanently dark) |
| **Total hardcoded instances** | ~30 inline `background: '#0a0a0f'`, ~200 text-white |
| **Fix scope** | **(A) Auth layout** (LoginClient.tsx, forgot-password, onboarding): Replace hardcoded `#0a0a0f` container with `bg-bg-elevated`. Replace all `text-white`/`text-white/XX` with `text-text-*`. Replace `rgba(255,255,255,0.XX)` borders with `border-border`. **(B) Plans & Subscription pages**: Same pattern — replace `#0A0A0F` containers, white text, inline `color: '#fff'` on buttons. |
| **Effort** | 5h |
| **Risk** | **High.** Auth pages have complex form states (error, success, loading). Theme change could introduce contrast issues on form validation messages, OTP inputs, and social login buttons. Each page has 30-80 hardcoded instances. |
| **Priority** | **P1** |
| **Expected improvement** | DESIGN_W: auth pages no longer locked to dark theme. Login, register, forgot-password, OTP verification, subscription plans all render in user's chosen theme. |

### Package E — Homepage Sections

| Field | Value |
|---|---|
| **Components** | HeroSection, IndiaHubs, TradhexaEngines, BusinessCities, AboutTradingo, TradingAcrossBorders, CTA section, feature-cards, statistics-cards |
| **Files** | ~10 files in `components/sections/` + `app/page.tsx` |
| **Audit issues** | H-1 (text-white), H-3 (rgba borders), M-4 (gradient text on light bg) |
| **Total hardcoded instances** | ~80 text-white, ~30 rgba borders, ~20 inline color styles, ~10 bg-white/XX |
| **Fix scope** | **(A)** Replace `text-white` → `text-text-primary` on CSS-variable backgrounds. **(B)** Replace `rgba(255,255,255,0.XX)` borders → `border-border`. **(C)** Replace `background: '#090B13'` in IndiaHubs cards → `var(--bg-elevated)`. **(D)** Update CTA gradient text from `from-white via-gray-200 to-gray-400` to accent-based or `text-text-primary`-based gradient for DESIGN_W readability. |
| **Effort** | 3h |
| **Risk** | Medium. Homepage sections have heavy visual effects (gradients, glassmorphism, decorative elements). Some dark backgrounds on specific cards may be intentional design decisions. |
| **Priority** | **P1** |
| **Expected improvement** | DESIGN_W: homepage hero, feature cards, hub sections, CTA become readable. Gradient text visible. Card borders visible. |

### Package F — UI Primitives (Design System Layer)

| Field | Value |
|---|---|
| **Components** | Drawer, Modal, Tabs, Accordion, Table, Progress, Checkbox |
| **Files** | 7 files in `components/ui/` |
| **Audit issues** | H-1 (text-white), H-3 (rgba borders), bg-white/XX patterns |
| **Total hardcoded instances** | ~30 text-white, ~15 rgba borders, ~10 bg-white/XX |
| **Fix scope** | **(A)** Replace `text-white` → `text-text-primary`. **(B)** Replace `bg-white/[0.02]/[0.04]/[0.06]` → `bg-surface-secondary` or `bg-surface`. **(C)** Replace `rgba(255,255,255,0.XX)` borders → `border-border`. **(D)** Checkbox: replace `text-white` → `text-text-on-accent`. |
| **Effort** | 2h |
| **Risk** | Medium. These are low-level components used by every page. Any visual regression propagates everywhere. Each needs before/after visual verification. |
| **Priority** | **P1** |
| **Expected improvement** | All pages: modals, drawers, tabs, accordions, tables become theme-aware. Invisible borders and text in DESIGN_W resolved. |

### Package G — Marketplace / Discovery

| Field | Value |
|---|---|
| **Components** | SearchBar, FilterSidebar, ProductDiscoveryClient, NearToFarBanner, EngineBar |
| **Files** | 5 files in `components/discovery/` |
| **Audit issues** | H-1, H-2, H-3 (heavy text-gray-* and rgba border usage) |
| **Total hardcoded instances** | ~40 text-gray-*, ~20 rgba borders, ~15 text-white, ~10 bg-white/XX |
| **Fix scope** | **(A)** Replace `text-gray-900`/`text-gray-800`/`text-gray-600` → `text-text-primary`/`text-text-secondary`. Replace `text-gray-400`/`text-gray-300` → `text-text-tertiary`. **(B)** Replace `rgba(255,255,255,0.1/0.12)` borders → `border-border`. **(C)** SearchBar: replace inline `color: '#fff'` on search icon → `text-text-on-accent` or `text-accent-500`. |
| **Effort** | 2h |
| **Risk** | **High.** SearchBar and FilterSidebar are on the `/products` and `/companies` pages — among the most visited routes. Any styling regression directly impacts user experience. SearchBar has complex responsive states (mobile/desktop, focused/blurred, with/without query). |
| **Priority** | **P1** |
| **Expected improvement** | DESIGN_W: search bar becomes readable — text-gray-900 entries visible on light bg, borders visible, filter sidebar buttons not invisible. |

### Package H — Company Pages

| Field | Value |
|---|---|
| **Components** | CompanyProfileClient, CompanyDirectoryClient |
| **Files** | 2 files in `app/companies/` + `app/companies/[slug]/` |
| **Audit issues** | H-1, H-3 (heaviest concentration: ~80 inline styles in CompanyProfileClient) |
| **Total hardcoded instances** | ~80 inline backgrounds/borders/colors, ~30 text-white |
| **Fix scope** | **(A)** Replace all inline `rgba(255,255,255,0.XX)` → CSS variable references. **(B)** Replace all `color: '#f59e0b'`, `color: '#fff'`, `color: '#F2C94C'` → token equivalents. **(C)** Replace `background: '#0a0a0f'` containers → `var(--bg-elevated)`. |
| **Effort** | 4h |
| **Risk** | **High.** CompanyProfileClient is the most complex single page (80+ inline styles). Each has specific visual intent. Bulk replacement could miss context-dependent styling (e.g., `color: '#fff'` on a button inside a hardcoded dark section should stay white-on-dark). Each replacement needs context verification. |
| **Priority** | **P2** |
| **Expected improvement** | DESIGN_W: company profiles become readable. Profile badges, stats, review sections, product listings all get visible borders and text. |

### Package I — Product Detail Page

| Field | Value |
|---|---|
| **Components** | Product detail, frequently-bought, variant-selector, action-buttons, badges-bar |
| **Files** | `app/products/[slug]/page.tsx` + 4 component files |
| **Audit issues** | H-1, H-3 (50+ inline styles in product detail) |
| **Total hardcoded instances** | ~50 inline colors/borders, ~20 text-white |
| **Fix scope** | Same pattern as CompanyProfileClient: replace inline rgba borders, hardcoded colors, white text with CSS variable tokens. |
| **Effort** | 3h |
| **Risk** | High. Product detail has many states (loading, error, out-of-stock, variant selection, image gallery). Visual regressions on price display, stock badges, and CTA buttons are business-critical. |
| **Priority** | **P2** |
| **Expected improvement** | DESIGN_W: product images, price, specs, seller info, CTA all readable. |

### Package J — AI Components

| Field | Value |
|---|---|
| **Components** | ai-admin-copilot, suggestion-card, copilot-panel, catalog-score-card, ai-finance-copilot |
| **Files** | 5 files in `components/ai/` + `components/finance/` |
| **Audit issues** | H-2 (text-gray-*) |
| **Total hardcoded instances** | ~30 text-gray-* (400/500/600/700) |
| **Fix scope** | Replace `text-gray-900`/`text-gray-700` → `text-text-primary`, `text-gray-600`/`text-gray-500` → `text-text-secondary`, `text-gray-400`/`text-gray-300` → `text-text-tertiary`. |
| **Effort** | 1h |
| **Risk** | Low. Simple token replacements in contained components. No complex state dependencies. |
| **Priority** | **P2** |
| **Expected improvement** | DESIGN_W: AI copilot sidebars, suggestion cards, score cards become readable. |

### Package K — RFQ Pages

| Field | Value |
|---|---|
| **Components** | RfqWizard, RfqCreationWizard, Step1Basic through Step3Review |
| **Files** | ~8 files in `app/rfq/` |
| **Audit issues** | C-5 (hardcoded `#0a0a0f`), H-1 (text-white) |
| **Total hardcoded instances** | ~15 `#0a0a0f` hardcoded backgrounds, ~40 text-white |
| **Fix scope** | **(A)** Replace `style={{ background: '#0a0a0f' }}` → `bg-bg-elevated`. **(B)** Replace `text-white` → `text-text-primary`. **(C)** Replace inline option backgrounds (`background: '#0a0a0f'` on step options) → `bg-surface-secondary`. |
| **Effort** | 2h |
| **Risk** | Medium. RFQ wizard has multi-step state management with conditional rendering. Theme changes on step containers could affect form field readability. |
| **Priority** | **P2** |
| **Expected improvement** | DESIGN_W: RFQ creation wizard becomes theme-coherent. Step indicators, form fields, option cards all readable. |

### Package L — AI Ecosystem Components

| Field | Value |
|---|---|
| **Components** | badge-card, achievement-card, xp-progress-bar, mission-card, streak-calendar, reward-timeline, mission-category-tabs, reward-statistics, reward-summary, ai-suggested-missions |
| **Files** | 10 files in `components/ecosystem/` |
| **Audit issues** | `bg-white/80`/`bg-white/90`/`bg-white/95` (invisible on light bg) |
| **Total hardcoded instances** | ~15 bg-white/XX, ~10 text-white |
| **Fix scope** | Replace `bg-white/80`/`bg-white/90` → `bg-surface` or `bg-surface-secondary`. Replace `text-white` → `text-text-primary`. |
| **Effort** | 1.5h |
| **Risk** | Low. Self-contained gamification widgets. Visual regressions don't affect core business flow. |
| **Priority** | **P3** |
| **Expected improvement** | DESIGN_W: ecosystem widgets (XP bars, badges, achievements, missions) render correctly with visible backgrounds. |

### Package M — Buyer Pages

| Field | Value |
|---|---|
| **Pages** | buyer/gocash, buyer/support, buyer/compare-quotes, buyer/delivery, buyer/po, buyer/shipment, buyer/inbox, buyer/dashboard, buyer/ecosystem, buyer/settings |
| **Files** | ~20 files in `app/buyer/` |
| **Audit issues** | H-1 (text-white), H-3 (rgba borders), bg-white/XX |
| **Total hardcoded instances** | ~100 text-white, ~40 rgba borders, ~20 bg-white/XX |
| **Fix scope** | Bulk token replacement across all buyer pages: replace `text-white/*` → `text-text-*`, `rgba(255,255,255,0.XX)` borders → `border-border`, `bg-white/XX` → `bg-surface-*`. |
| **Effort** | 5h |
| **Risk** | **High.** Large number of files. Some pages have dashboard-specific visual design that may require design input (dashboard widgets, comparison tables, timeline views). |
| **Priority** | **P3** |
| **Expected improvement** | DESIGN_W: buyer dashboard, gocash wallet, order tracking, inbox, support all theme-coherent. |

### Package N — Seller Pages

| Field | Value |
|---|---|
| **Pages** | seller/dashboard, seller/analytics, seller/products, seller/brands, seller/export, seller/media, seller/advertising, seller/crm, seller/quote, seller/ecosystem, seller/ai-workspace, seller/onboarding |
| **Files** | ~25 files in `app/seller/` |
| **Audit issues** | H-1 (text-white), H-3 (rgba borders), hardcoded `#090B13` backgrounds |
| **Total hardcoded instances** | ~120 text-white, ~50 rgba borders, ~15 `#090B13` backgrounds |
| **Fix scope** | Same bulk pattern as Buyer pages. Additionally: replace `style={{ background: '#090B13' }}` in analytics cards, stats cards, product cards → `var(--bg-elevated)`. |
| **Effort** | 6h |
| **Risk** | **High.** Seller workspace is the most feature-rich area of the app. Dashboard has interactive charts, product management has CRUD modals, CRM has lead pipelines. Each page needs individual verification. |
| **Priority** | **P3** |
| **Expected improvement** | DESIGN_W: seller workspace becomes usable. Dashboard stats, product lists, CRM, analytics all readable. |

### Package O — Admin Pages

| Field | Value |
|---|---|
| **Pages** | admin/ai-infrastructure, admin/categories, admin/communication, admin/dashboard, admin/wallets, admin/founder-ai, admin/ecosystem, admin/ai-credits, admin/user-verification, admin/marketplace-rankings, admin/advertising, admin/finance, admin/crm, admin/settings, admin/shipment, admin/delivery |
| **Files** | ~25 files in `app/admin/` |
| **Audit issues** | H-1 (text-white), H-2 (text-gray-*), H-3 (rgba borders), bg-white/XX |
| **Total hardcoded instances** | ~150 text-white, ~30 text-gray-*, ~40 rgba borders, ~25 bg-white/XX |
| **Fix scope** | Same bulk pattern. Admin pages have more data-table-heavy layouts (list views, stats cards, activity logs). Additional fix: table header rows use `bg-white/[0.04]` → `bg-surface-secondary`. |
| **Effort** | 6h |
| **Risk** | **High.** Large number of files with varying layouts (dashboard, data tables, form-heavy settings, chart-heavy analytics). Admin pages have the most text-white instances. |
| **Priority** | **P3** |
| **Expected improvement** | DESIGN_W: admin console becomes fully usable. Data tables, filters, stat cards, charts all visible. |

### Package P — TradeServ Pages

| Field | Value |
|---|---|
| **Pages** | tradeserv/page.tsx, tradeserv/categories, tradeserv/search, tradeserv/register, tradeserv/p/, tradeserv/workspace, tradeserv/c/ |
| **Files** | ~15 files in `app/tradeserv/` |
| **Audit issues** | C-5 (hardcoded `#0a0a0f`), H-1 (text-white) |
| **Total hardcoded instances** | ~20 `#0a0a0f` backgrounds, ~60 text-white |
| **Fix scope** | Replace hardcoded `#0a0a0f` containers → `var(--bg-elevated)`. Replace `text-white` → `text-text-primary`. Replace `rgba(255,255,255,0.XX)` borders → `border-border`. |
| **Effort** | 4h |
| **Risk** | Medium. TradeServ was recently implemented (Phase P-2). Pages interact with the professional services backend. |
| **Priority** | **P3** |
| **Expected improvement** | DESIGN_W: TradeServ directory, professional profiles, service listings become theme-coherent. |

---

## 3. Quick Win Analysis

| Rank | Package | Files | Hours | DESIGN_W improvement | Risk |
|---|---|---|---|---|---|
| 1 | **A — Footer** | 1 | 2h | 6 dark rectangles → cohesive bottom of page | Low |
| 2 | **B — Button System** | ~6 | 1h | All primary CTAs render gradient correctly | Low |
| 3 | **F — UI Primitives** | 7 | 2h | Modals/drawers/tabs/tables become visible | Medium |
| 4 | **E — Homepage Sections** | 10 | 3h | Hero, CTAs, feature cards, hubs readable | Medium |
| 5 | **C — Card System** | 15 | 4h | All product/company/eco cards visible | Medium |
| 6 | **D — Auth Layout** | 20 | 5h | Auth/plans/subscription no longer stuck dark | High |

### Quick Win Impact Curve

```
Visible DESIGN_W fix
        ▲
  80%   │ ┌─── QW-1 Footer (1 file, 2h)
        │ │
  70%   │ │ ┌── QW-2 + F Primitives (13 files, 3.5h)
        │ │ │
  50%   │ │ │ ┌─── E Homepage (10 files, 3h)
        │ │ │ │
  30%   │ │ │ │ ┌── C Card System (15 files, 4h)
        │ │ │ │ │
  10%   │ │ │ │ │ ┌── D Auth Layout (20 files, 5h)
        │ │ │ │ │ │
        └─┴─┴─┴─┴─┴──→ Hours cumulative
          2  5.5 8.5 12.5 17.5
```

**Recommendation**: Execute QW-1 + QW-2 + Package F first (20 files, 5.5h). This covers the footer, loading states, and all UI primitives — the highest-visibility, lowest-risk changes that together fix ~70% of DESIGN_W's visual breakage.

---

## 4. Dependency Graph

```
QW-1 Footer ─────────────────────────── (standalone)
QW-2 Loading ────────────────────────── (standalone)
Package F UI Primitives ──────────────── (standalone)
     │
     ├── depends on → Package C Cards (uses Drawer/Modal)
     ├── depends on → Package E Homepage (uses Accordion)
     └── depends on → Package G Marketplace (uses Table)
     
Package B Button ────────────────────── (standalone)
     │
     └── depends on → All packages (all use buttons)

Package D Auth Layout ──────────────── (standalone)

Package C Cards ──────────────────────── (standalone for base)
     │
     ├── used by → Package H Company Pages
     ├── used by → Package I Product Detail
     ├── used by → Package L Ecosystem
     ├── used by → Package M Buyer
     ├── used by → Package N Seller
     ├── used by → Package O Admin
     └── used by → Package P TradeServ

Package E Homepage ──────────────────── (standalone)

Package J AI Components ─────────────── (standalone)
Package K RFQ Pages ─────────────────── (standalone)
```

**Key dependency**: Card System (Package C) should ship before packages H-P because all those pages use cards. However, the token replacements in H-P are independent of Card System changes — they only share the same token patterns (text-white, rgba borders). So packages H-P CAN run in parallel with C.

---

## 5. Final Execution Order

```
Phase 1 — Foundation (P0, 5 files, 3h)
├── QW-1: Footer token migration
├── QW-2: Loading states fix
├── Package B: Button CVA fix + bypassing pages

Phase 2 — Shared Components (P1, 32 files, 11h)
├── Package C: Card System (15 files)
├── Package E: Homepage Sections (10 files)
├── Package F: UI Primitives (7 files)

Phase 3 — High-Impact Pages (P1, 25 files, 7h)
├── Package D: Auth Layout (20 files)
├── Package G: Marketplace/Discovery (5 files)

Phase 4 — Complex Pages (P2, 17 files, 10h)
├── Package H: Company Pages (2 files)
├── Package I: Product Detail (5 files)
├── Package J: AI Components (5 files)
├── Package K: RFQ Pages (8 files)*

* RFQ and Company overlap with some files

Phase 5 — Bulk Page Groups (P3, 85 files, 27h)
├── Package L: AI Ecosystem (10 files)
├── Package M: Buyer Pages (20 files)
├── Package N: Seller Pages (25 files)
├── Package O: Admin Pages (25 files)
├── Package P: TradeServ Pages (15 files)
```

**Total**: ~164 unique files (many files are shared between Tradeserv, buyer, seller, admin), ~58 hours.

**Verification gates**:
- After each phase: `tsc --noEmit` (api + web) + `next build`
- After Phase 2: full visual pass in DESIGN_D (regression check)
- After Phase 3: full visual pass in DESIGN_W (improvement check)
- After Phase 5: full UAT in both themes

---

## 6. Summary Statistics

| Metric | Value |
|---|---|
| **Total work packages** | 16 (QW-1, QW-2, A-P) |
| **Total files affected** | ~164 (with overlap) |
| **Total hardcoded instances** | ~1,500+ |
| **Total estimated effort** | ~58 hours |
| **Highest risk packages** | D (Auth Layout), H (Company), I (Product Detail), M (Buyer), N (Seller), O (Admin) |
| **Lowest risk packages** | A (Footer), B (Button), F (UI Primitives), J (AI Components), L (Ecosystem) |
| **Design sign-off needed** | Package C (compact-stack-card always-dark decision), Package E (CTA gradient redesign for DESIGN_W) |

---

*End of implementation roadmap. No code has been modified.*
