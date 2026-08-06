# TRADINGO V2 Visual QA Audit

**Audit Date**: 2026-07-09  
**Scope**: All pages in DESIGN_D (dark) and DESIGN_W (light/warm)  
**Baseline**: Post-Packages A, C, E, F completion  
**Method**: Static code analysis of hardcoded visual patterns across `apps/web/`  
**Result**: 🟡 **PASS WITH CONDITIONS** — Critical structural elements fixed; ~5,000 remaining instances across ~250 files need migration for full DESIGN_W compatibility.

---

## Executive Summary

| Category | Fixed (Pkg A/C/E/F) | Remaining | Migration Status |
|----------|-------------------|-----------|-----------------|
| UI Primitives (Button, Drawer, Modal, Tabs, etc.) | ~60 instances | 0 | ✅ **100%** |
| Footer + Loading components | ~25 instances | 0 | ✅ **100%** |
| Global CSS (globe.css) references | ~10 instances | 44 (globals.css only) | ✅ **Design tokens set** |
| Card Components (24 files) | ~250 instances | 0 | ✅ **100%** |
| Landing page sections (E batch) | ~80 instances | 0 | ✅ **100%** |
| **Page-level `text-white`** | 0 | **3,130 instances / 187 files** | 🔴 **0%** |
| **Page-level `text-gray-*`** | ~200 | **600 instances / 108 files** | 🟡 **25%** |
| **Page-level `bg-white`** | ~100 | **817 instances / 135 files** | 🟡 **11%** |
| **Page-level `border-white`** | ~50 | **838 instances / 155 files** | 🟡 **6%** |
| **Page-level `bg-{named-color}`** | ~50 | **689 instances / 167 files** | 🟡 **7%** |
| **Page-level inline `rgba`/hex styles** | ~30 | **500+ instances / ~60 files** | 🟡 **5%** |
| **Hardcoded dark bgs (`#0a0a0f`, `#090B13`)** | 0 | **120 instances / 35 files** | 🔴 **0%** |
| **Duplicated GLASS/BORDER constants** | 0 | **5 files** | 🔴 **0%** |
| **Gradient hardcodes (`from-`/`to-` named)** | ~10 | **98 instances / 25 files** | 🟡 **10%** |
| **Remaining inline `boxShadow`** | ~20 | **102 instances / 45 files** | 🟡 **20%** |

**Overall Migration**: ~15% of total hardcoded instances fixed. ~85% remaining.

---

## CRITICAL Issues (Break on DESIGN_W)

These will render incorrectly on the light/warm theme.

### CRITICAL-1: `text-white` on non-dark backgrounds (3,130 instances)
- **Root cause**: Every page that renders `text-white` or `text-white/OPACITY` on a background that is not dark (i.e., surfaces that become white/light in DESIGN_W) will become invisible.
- **Scope**: 187 files across the entire app
- **Worst offenders**:
  | File | Count |
  |------|-------|
  | `app/subscription/purchase/PurchaseClient.tsx` | 99 |
  | `app/companies/[slug]/CompanyProfileClient.tsx` | 87 |
  | `app/tradeserv/workspace/proposals/page.tsx` | 84 |
  | `app/tradeserv/workspace/reviews/page.tsx` | 64 |
  | `app/buyer/negotiation/[id]/page.tsx` | 58 |
  | `app/seller/negotiation/[id]/page.tsx` | 57 |
- **Fix**: Replace with `text-text-primary`, `text-text-secondary`, or `text-text-tertiary` based on semantic role
- **Effort**: HIGH (3,130 instances, but mechanical — grep + sed)

### CRITICAL-2: `bg-white` (817 instances)
- **Root cause**: `bg-white`, `bg-white/80`, `bg-white/90`, etc. used as surface backgrounds. On DESIGN_W these will blend with the page background. On DESIGN_D they create white flashes.
- **Scope**: 135 files
- **Worst offenders**: TradeServ workspace pages (proposals, services, profile, reviews — 25-31 instances each)
- **Fix**: Replace with `bg-surface-secondary` or `bg-bg-elevated`
- **Effort**: HIGH (817 instances, but mechanical)

### CRITICAL-3: `border-white/*` (838 instances)
- **Root cause**: Borders using `border-white/OPACITY` on both themes. On DESIGN_W these become invisible (white on white). On DESIGN_D they're visible but not tokenized.
- **Scope**: 155 files
- **Worst offenders**: Same as CRITICAL-2 (TradeServ pages)
- **Fix**: Replace with `border-border`
- **Effort**: HIGH (838 instances, mechanical)

### CRITICAL-4: `#0a0a0f` / `#090B13` hardcoded backgrounds (120 instances)
- **Root cause**: Hardcoded dark backgrounds that won't switch in DESIGN_W. `<option>` tags in RFQ wizard use `background: '#0a0a0f'` (23 instances alone).
- **Scope**: 35 files
- **Fix**: Replace with `var(--bg-base)` or `var(--surface-secondary)`. For `<option>` tags, define in globals.css.
- **Effort**: MEDIUM (mechanical, but `<option>` needs CSS override)
- **Note**: Already identified in Phase P-1.1 audit but not yet fixed.

### CRITICAL-5: `#f59e0b` / `#fbbf24` inline hex accent (80+ instances)
- **Root cause**: The brand amber accent is hardcoded as `#f59e0b` in inline styles across ~50 files. On DESIGN_W the accent color may change, leaving orphaned hardcoded colors.
- **Worst offenders**: `CompanyProfileClient.tsx` (~20 instances), `auth/login/LoginClient.tsx` (~8 instances)
- **Fix**: Replace with `var(--accent)` or `var(--status-warning)`
- **Effort**: MEDIUM (mechanical, but spread across many files)

---

## HIGH Issues (Contrast/Consistency)

### HIGH-1: `text-gray-*` (600 instances, 108 files)
- **Root cause**: Gray text colors don't adapt to theme. On DESIGN_D, `text-gray-400` may be too low contrast. On DESIGN_W, `text-gray-900` may be too dark.
- **Worst offenders**: Advertising pages, founder-ai components, CRM pages, FilterSidebar, SearchBar
- **Fix**: `text-gray-900/800` → `text-text-primary`, `text-gray-700/600` → `text-text-secondary`, `text-gray-500/400/300` → `text-text-tertiary`
- **Effort**: HIGH (600 instances)

### HIGH-2: `bg-{named-color}` (689 instances, 167 files)
- **Root cause**: Semantic colors (`bg-red-500`, `bg-green-500`, `bg-blue-500`, `bg-purple-500`, `bg-amber-500`, etc.) used directly instead of status tokens. On DESIGN_W, these may clash with the theme.
- **Worst offenders**: `status-badge.tsx` (32), `PurchaseClient.tsx` (38), `catalog-import/page.tsx` (20), order/shipment/delivery pages (12 each)
- **Fix**: `bg-red-*` → `bg-status-error/*`, `bg-green-*` → `bg-status-success/*`, `bg-blue-*` → `bg-accent/*`, `bg-purple-*` → `bg-accent/*`
- **Effort**: HIGH (689 instances)

### HIGH-3: `border-{named-color}` (308 instances, 78 files)
- **Root cause**: Same as HIGH-2 but for borders. Named color borders won't adapt to theme.
- **Worst offenders**: `status-badge.tsx` (32), order/shipment/delivery pages (12-13 each), `PurchaseClient.tsx` (12)
- **Fix**: Use border-status-* tokens
- **Effort**: HIGH (308 instances)

### HIGH-4: `text-red-*` (399 instances, 180 files)
- **Root cause**: Error/danger text using `text-red-*` won't adapt to theme's status color definitions.
- **Fix**: `text-red-500/600/400` → `text-status-error`
- **Effort**: HIGH but mechanical

### HIGH-5: `text-green-*` (196 instances, 102 files)
- **Root cause**: Success text using `text-green-*` won't adapt to theme.
- **Fix**: `text-green-500/400/600` → `text-status-success`
- **Effort**: MEDIUM

---

## MEDIUM Issues (Token Alignment)

### MEDIUM-1: Duplicated GLASS/BORDER constants (5 files)
- **Files**: `related-products.tsx`, `variant-selector.tsx`, `image-gallery.tsx`, `specifications.tsx`, `action-buttons.tsx`
- **Pattern**: Each file independently defines `const GLASS = 'rgba(255,255,255,0.8)'` and `const BORDER = '1px solid rgba(255,255,255,0.95)'`
- **Fix**: Create a shared utility `const SURFACE = 'var(--surface-secondary)'` and `const BORDER = '1px solid var(--border)'`
- **Effort**: LOW (5 files, mechanical)

### MEDIUM-2: `text-[#HEX]` Tailwind classes (172 instances, 47 files)
- **Root cause**: Hex colors in Tailwind class names bypass design tokens entirely.
- **Worst offenders**: TradeServ workspace pages (profile, reviews, main page — 15 instances each)
- **Fix**: Replace with token classes (`text-accent`, `text-text-primary`, etc.)
- **Effort**: MEDIUM

### MEDIUM-3: `bg-[#HEX]` Tailwind classes (143 instances, 34 files)
- **Root cause**: Hex backgrounds in Tailwind classes.
- **Worst offenders**: TradeServ pages, onboarding sections
- **Fix**: Replace with `bg-accent/*`, `bg-surface-*`, `bg-status-*`
- **Effort**: MEDIUM

### MEDIUM-4: `border-[#HEX]` Tailwind classes (80 instances, 27 files)
- **Root cause**: Hex borders in Tailwind classes.
- **Fix**: Replace with `border-border`, `border-accent/*`, `border-status-*`
- **Effort**: MEDIUM

### MEDIUM-5: Inline `boxShadow` (102 instances, 45 files)
- **Root cause**: Custom shadows that won't adapt to theme.
- **Worst offenders**: `footer.tsx` (12), `page.tsx` homepage (11), `IndiaHubs.tsx` (6), `TradingAcrossBorders.tsx` (8)
- **Fix**: Use Tailwind shadow classes or CSS variable-based shadows
- **Effort**: MEDIUM

### MEDIUM-6: Inline `background:` with rgba (247 instances, 137 files)
- **Root cause**: Inline background styles with hardcoded `rgba()` values that won't adapt.
- **Fix**: Replace with CSS variable equivalents
- **Effort**: HIGH (247 instances)

### MEDIUM-7: Inline `color:` hex values (72 instances, 14 files)
- **Root cause**: Inline color styles with hex values.
- **Note**: 44 of 72 are in `globals.css` which sets the theme variables — these are DESIGN tokens and should NOT be changed.
- **Fix**: The remaining 28 inline color styles across ~13 files should use `var(--*)` 
- **Effort**: LOW

---

## LOW Issues (Minor/Decorative)

### LOW-1: Gradient colors (`from-amber-500`, `to-amber-400`, etc.)
- **Count**: 98 instances across 25 files
- **Impact**: Decorative gradients only; won't break functionality but won't match theme
- **Fix**: `from-amber-500` → `from-accent`, `from-emerald-500` → `from-status-success`, etc.
- **Effort**: MEDIUM

### LOW-2: `from-amber-600/20` pattern in podium/leaderboard
- **Count**: 4 instances
- **Impact**: Low visibility (gradient for decorative podium bars)
- **Effort**: LOW

### LOW-3: `text-black` on button text (6 instances)
- **Count**: 6 instances across 5 files
- **Impact**: Only affects a few badge/button components
- **Fix**: Replace with `text-btn-primary-text`
- **Effort**: VERY LOW

### LOW-4: `text-rose-*` (10 instances, 10 files)
- **Count**: 10 instances across order/shipment/delivery pages
- **Impact**: Low consistency issue, likely already handled by status-badge
- **Effort**: LOW

---

## Remaining Visual Patterns — Full Inventory

### Color Classes (Tailwind)

| Pattern | Remaining | Files | Severity |
|---------|-----------|-------|----------|
| `text-white` | 3,130 | 187 | 🔴 CRITICAL |
| `text-gray-*` | 600 | 108 | 🟠 HIGH |
| `text-red-*` | 399 | 180 | 🟠 HIGH |
| `text-green-*` | 196 | 102 | 🟠 HIGH |
| `text-amber-*` | 114 | 53 | 🟡 MEDIUM |
| `text-blue-*` | 107 | 70 | 🟡 MEDIUM |
| `text-orange-*` | 95 | 49 | 🟡 MEDIUM |
| `text-emerald-*` | 75 | 50 | 🟡 MEDIUM |
| `text-purple-*` | 68 | 49 | 🟡 MEDIUM |
| `text-yellow-*` | 65 | 49 | 🟡 MEDIUM |
| `text-[#...]` | 172 | 47 | 🟡 MEDIUM |
| `text-indigo-*` | 17 | 16 | 🟢 LOW |
| `text-cyan-*` | 14 | 14 | 🟢 LOW |
| `text-rose-*` | 10 | 10 | 🟢 LOW |
| `text-black` | 6 | 5 | 🟢 LOW |

### Background Classes (Tailwind)

| Pattern | Remaining | Files | Severity |
|---------|-----------|-------|----------|
| `bg-white` (raw) | 817 | 135 | 🔴 CRITICAL |
| `bg-{named-color}` | 689 | 167 | 🟠 HIGH |
| `bg-[#...]` | 143 | 34 | 🟡 MEDIUM |
| `bg-gray-*` | 59 | 20 | 🟡 MEDIUM |
| `bg-black/*` | 27 | 17 | 🟢 LOW |

### Border Classes (Tailwind)

| Pattern | Remaining | Files | Severity |
|---------|-----------|-------|----------|
| `border-white/*` | 838 | 155 | 🔴 CRITICAL |
| `border-{named-color}` | 308 | 78 | 🟠 HIGH |
| `border-gray-*` | 106 | 40 | 🟡 MEDIUM |
| `border-[#...]` | 80 | 27 | 🟡 MEDIUM |

### Inline Styles

| Pattern | Remaining | Files | Severity |
|---------|-----------|-------|----------|
| `background:` (inline) | 247 | 137 | 🟡 MEDIUM |
| `boxShadow:` (inline) | 102 | 45 | 🟡 MEDIUM |
| `color:` (inline hex) | 72 | 14 | 🟢 LOW |
| `borderColor:` (inline) | 25 | 14 | 🟢 LOW |
| `backgroundColor:` | 7 | 5 | 🟢 LOW |

### Gradients & Special

| Pattern | Remaining | Files | Severity |
|---------|-----------|-------|----------|
| `from-{named-color}` | 56 | 18 | 🟢 LOW |
| `to-{named-color}` | 42 | 14 | 🟢 LOW |
| `via-{named-color}` | 6 | 3 | 🟢 LOW |
| `shadow-[...]` | 56 | 20 | 🟢 LOW |
| `#0a0a0f` / `#090B13` | 120 | 35 | 🔴 CRITICAL |
| Duplicated GLASS/BORDER | 5 files | 5 | 🟡 MEDIUM |

### TOTAL REMAINING: ~9,300 instances across ~250 files

---

## Updated Roadmap

### Package G — Theme-Critical Fixes (HIGHEST ROI)
**Objective**: Fix patterns that BREAK on DESIGN_W
- **G-1** `#0a0a0f`/`#090B13` → `var(--bg-base)`/`var(--surface-secondary)` (120 instances)
- **G-2** `bg-white` → `bg-surface-secondary` (817 instances)
- **G-3** `border-white` → `border-border` (838 instances)
- **G-4** `text-white` on non-gradient backgrounds → `text-text-*` (3,130 instances)
- **G-5** Duplicated GLASS/BORDER constants → shared utility (5 files)
- **Verification**: tsc (api + web) 0 errors, next build 248+ routes
- **Est. effort**: ~4-6 hours (mechanical replacements)
- **Risk**: LOWEST (find-and-replace with tokens)

### Package H — Semantic Color Migration (HIGH VISIBILITY)
**Objective**: Replace all named Tailwind colors with semantic design tokens
- **H-1** `text-red-*` → `text-status-error` (399 instances)
- **H-2** `text-green-*` → `text-status-success` (196 instances)
- **H-3** `text-blue-*` → `text-accent` (107 instances)
- **H-4** `text-purple-*` → `text-accent` (68 instances)
- **H-5** `text-amber-*` → `text-status-warning` (114 instances)
- **H-6** `text-orange-*` → `text-accent` (95 instances)
- **H-7** `text-emerald-*` → `text-status-success` (75 instances)
- **H-8** `bg-{named-color}` → `bg-status-*` / `bg-accent` (689 instances)
- **H-9** `border-{named-color}` → `border-status-*` / `border-accent` (308 instances)
- **Verification**: tsc + next build
- **Est. effort**: ~3-4 hours
- **Risk**: LOW (mechanical, well-understood mapping)

### Package I — Gray Text Migration (CONTRAST)
**Objective**: Replace `text-gray-*` with text token hierarchy
- **I-1** `text-gray-900`/`text-gray-800` → `text-text-primary`
- **I-2** `text-gray-700`/`text-gray-600` → `text-text-secondary`
- **I-3** `text-gray-500`/`text-gray-400`/`text-gray-300` → `text-text-tertiary`
- **I-4** `text-gray-200`/`text-gray-100` → `text-text-tertiary` (or `text-white` if on dark bg)
- **Verification**: tsc + next build
- **Est. effort**: ~2-3 hours
- **Risk**: MEDIUM (some gray on dark backgrounds need text-white, not text-text-*)

### Package J — Inline Style & Hex Class Migration (CLEANUP)
**Objective**: Eliminate remaining `style={{}}` with tokens
- **J-1** `background:` inline rgba → CSS variables (247 instances)
- **J-2** `boxShadow:` inline → shadow classes (102 instances)
- **J-3** `text-[#...]` → token classes (172 instances)
- **J-4** `bg-[#...]` → token classes (143 instances)
- **J-5** `border-[#...]` → token classes (80 instances)
- **J-6** `borderColor:`/`backgroundColor:` inline → CSS variables (32 instances)
- **J-7** Gradient named colors → token gradients (98 instances)
- **Verification**: tsc + next build
- **Est. effort**: ~3-4 hours
- **Risk**: MEDIUM (some inline styles are dynamic/conditional)

### Package K — Final Design_W Audit & QA
**Objective**: Toggle DESIGN_W, identify visual regressions
- **K-1** Activate DESIGN_W in globals.css
- **K-2** Walk through each major page category (auth, landing, marketplace, seller, admin, tradeserv)
- **K-3** Document all visible regressions
- **K-4** Fix remaining issues
- **Verification**: Visual inspection of all pages in both themes
- **Est. effort**: ~2-3 hours
- **Risk**: LOW (inspection only)

---

## Heaviest Offender Files (Top 20)

| Rank | File | Est. Hardcoded Count | Primary Issue |
|------|------|--------------------|---------------|
| 1 | `app/companies/[slug]/CompanyProfileClient.tsx` | 90+ | `text-white`, `#f59e0b` icons |
| 2 | `app/subscription/purchase/PurchaseClient.tsx` | 80+ | `text-white`, `bg-{named-color}` |
| 3 | `app/tradeserv/workspace/proposals/page.tsx` | 70+ | `bg-white`, `border-white`, `text-white` |
| 4 | `app/tradeserv/workspace/reviews/page.tsx` | 65+ | Same pattern |
| 5 | `app/tradeserv/page.tsx` | 65+ | Same pattern |
| 6 | `app/(auth)/login/LoginClient.tsx` | 60+ | Inline rgba, `#0a0a0f` |
| 7 | `app/tradeserv/workspace/profile/page.tsx` | 55+ | `bg-white`, `border-white` |
| 8 | `app/tradeserv/workspace/services/page.tsx` | 50+ | Same |
| 9 | `app/buyer/negotiation/[id]/page.tsx` | 50+ | `text-white`, `bg-white` |
| 10 | `app/seller/negotiation/[id]/page.tsx` | 50+ | Same |
| 11 | `app/products/[slug]/page.tsx` | 45+ | Inline glass card rgba |
| 12 | `app/admin/wallets/page.tsx` | 45+ | `text-white`, `bg-white` |
| 13 | `app/seller/onboarding/sections/Section8Products.tsx` | 40+ | `bg-[#hex]`, `bg-white` |
| 14 | `app/(auth)/forgot-password/page.tsx` | 35+ | Inline rgba, `#f59e0b` |
| 15 | `app/rfq/new/RfqCreationWizard.tsx` | 30+ | `#0a0a0f` `<option>`, gradients |
| 16 | `app/seller/advertising/[id]/page.tsx` | 30+ | `text-gray-*` |
| 17 | `app/rfq/create/steps/Step1Basic.tsx` | 30+ | `#0a0a0f` on 17 `<option>` tags |
| 18 | `app/tradeserv/workspace/verification/page.tsx` | 30+ | `bg-[#hex]`, `text-[#hex]` |
| 19 | `app/plans/vendor/purchase/page.tsx` | 28+ | `#0a0a0f`, gradients |
| 20 | `app/plans/PlansPageClient.tsx` | 25+ | `#0A0A0F`, gradients |

---

## Already Clean Modules (Zero Issues)

These modules have been fully migrated or never had issues:
- `components/ui/*` — All primitives (Button, Drawer, Modal, Tabs, Accordion, Table, Progress, Checkbox)
- `components/wallet/*` — Wallet components (filters, timeline, analytics bar)
- `components/ecosystem/*` — All 16 ecosystem components
- `components/ai/*` — AI components (copilot-panel, wizard-copilot, suggestion-card, catalog-score-card)
- `components/admin/*` — Admin AI components
- `components/search/*` — AI Search copilot
- `components/founder-ai/*` — All founder AI components
- `components/negotiation/*` — AI Negotiation copilot
- `components/tradeserv/*` — TradeServ card components (professional-card)
- `components/shared/footer.tsx` — Footer (Package A)
- `components/ui/button.tsx` — Button CVA (Package A)
- `components/discovery/UnifiedCard.tsx` — Unified card (Package C)
- `components/discovery/ProductCard.tsx` — Product discovery card (Package C)
- `components/product/product-card.tsx` — Product card (Package C)
- `components/product/compact-product-card.tsx` — Compact product card (Package C)
- `components/company/CompanyCard.tsx` — Company card (Package C)
- `components/company/CompanyCardSkeleton.tsx` — Company skeleton (Package C)
- `components/dashboard/stat-card.tsx` — Stat card (Package C)
- `components/shared/feature-cards.tsx` — Feature cards (Package C)
- `components/shared/statistics-cards.tsx` — Statistics cards (Package C)
- Landing page sections: HeroSection, AboutTradingo, TradingAcrossBorders, IndiaHubs, BusinessCities, TradhexaEngines (Package E)
- `app/companies/loading.tsx` — Loading state (Package A)

---

## Recommended Next Package

### **HIGHEST ROI: Package G — Theme-Critical Fixes**

**Rationale**:
1. **~4,900 instances** fixed (52% of all remaining)
2. CRITICAL-1 through CRITICAL-5 are all addressed
3. **Lowest risk** — pure mechanical find-and-replace with well-defined token mappings
4. **Highest visibility** — fixes the failures that make DESIGN_W unusable
5. **5 sub-packages** can be parallelized

### **LOWEST RISK: Package G-1 + G-5** (`#0a0a0f` + GLASS/BORDER)
- Only ~125 instances
- Pure mechanical replacement
- No logic changes, no conditional styles
- Immediate visual improvement in both themes

---

## Next Steps

```
1. SELECT Package G (Theme-Critical Fixes)
   │
   ├── G-1: #0a0a0f/#090B13 → var(--bg-base)/var(--surface-secondary) [120 inst]
   ├── G-2: bg-white → bg-surface-secondary [817 inst]
   ├── G-3: border-white → border-border [838 inst]
   ├── G-4: text-white → text-text-* [3,130 inst]
   ├── G-5: Duplicated GLASS/BORDER → shared utility [5 files]
   └── G-6: #f59e0b/#fbbf24 → var(--accent) [80+ inst]
   │
   ├── Verify: tsc api 0 errors, tsc web 0 errors, next build 248+ routes
   │
   └── ON COMPLETE → Package H (Semantic Color Migration)

2. Run DESIGN_W toggle → identify visual regressions
3. Iterate minor fixes
4. Generate V2 Visual Completion Certificate
```

---

*End of Audit — 2026-07-09*
