# FOUNDER VISUAL AUDIT — P0.7 Discovery Pages

**Status:** ✅ DECISION 1 IMPLEMENTED + VERIFIED (2026-08-01) — no other changes
**Date:** 2026-08-01
**Scope:** `/products` + `/companies` (approved P0.7 design language), plus cross-page verification of P0.6 detail page
**Method:** Evidence-based audit — Playwright computed-style + DOM probes against the LIVE stack (API :3001, web :3000), full-page screenshots at 1280px & 390px. Every score is backed by measured values. Screenshots: `docs/review/P0.7-VISUAL-AUDIT/*-live.png` (4 pages + detail). Raw evidence: `evidence-live.json`, `precision-probe.json`.

---

## 0. CRITICAL CROSS-PAGE FINDING (affects every score below)

**Root cause — brand accent utilities do not exist at runtime.**

`apps/web/app/globals.css` line 338 defines the accent token in the Tailwind v4 `@theme` block as:

```css
--color-accent-DEFAULT: var(--accent);
```

Tailwind v4 does **not** map the `-DEFAULT` suffix to bare utilities (that is v3 `colors.accent.DEFAULT` convention). Verified at runtime on all 4 probes:

| Token | Runtime state |
|---|---|
| `--color-accent` | MISSING |
| `--color-accent-DEFAULT` | MISSING (tree-shaken, unused) |
| `--color-accent-500` | `#ff4d00` ✅ (works — nav pill, gradients) |
| `.bg-accent` / `.text-accent` / `.border-accent` / `.bg-accent\/10` / `.from-accent` | **NO RULE GENERATED** |

**Consequence:** every `bg-accent`, `text-accent`, `border-accent`, `bg-accent/xx`, `fill-accent`, `from-accent` class renders transparent / inherited / black-fill. Inline `var(--accent)` usages (product card Buy/RFQ buttons) render correctly — which is why card actions look fine while everything else is broken.

**Exact UI adjustment (1 line):** in `globals.css` `@theme`, change line 338 to:
```css
--color-accent: var(--accent);
```
(optionally keep `--color-accent-DEFAULT` as a second alias). This single change fixes kickers, CTA buttons, active pills, card icons, breadcrumb hovers, gradient underlines, and P0.6 detail chips platform-wide.

---

## 1. `/products` — 13-section scorecard

| # | Section | Score | Verdict |
|---|---|---|---|
| 1 | Header | 97% | ✅ |
| 2 | Hero | 88% | ⚠️ <95% |
| 3 | Breadcrumb | 92% | ⚠️ <95% |
| 4 | Search | 96% | ✅ |
| 5 | Filters | 88% | ⚠️ <95% |
| 6 | Cards | 93% | ⚠️ <95% |
| 7 | Typography | 90% | ⚠️ <95% |
| 8 | Spacing | 97% | ✅ |
| 9 | Trust Signals | 90% | ⚠️ <95% |
| 10 | CTA hierarchy | 95% | ✅ |
| 11 | Empty State | 100% | ✅ |
| 12 | Mobile | 97% | ✅ |
| 13 | Premium Feel | 88% | ⚠️ <95% |

### <95% items — screenshot + reason + adjustment

**Hero (88%)** — Screenshot: `products-1280px-live.png` (top).
- LEFT (approved): kicker "Discovery Engine" in brand accent, 11px black-uppercase; 3px orange gradient underline under the title; title at 1.9rem black.
- RIGHT (current): h1 "Products & Services" 30.4px/900 `#f0f4ff` ✅; kicker `text-accent` → computed `rgb(240,244,255)` (white, not `#FF4D00`); underline `from-accent via-accent-amber to-transparent` → `.from-accent` has no rule → gradient stops invalid → **invisible** (the visible 3px bar is absent; only the EngineBar's own `from-accent-500` gradient text shows).
- Adjustment: `--color-accent` fix (Section §0). Re-verify kicker `#FF4D00` and underline renders `#FF4D00 → #F59E0B → transparent`.

**Breadcrumb (92%)** — Screenshot: `products-1280px-live.png` (below hero).
- LEFT: pill breadcrumb with accent hover on "Home".
- RIGHT: pill ✅ (bg-surface/80 + border-border + backdrop blur, measured `oklab(.../0.8)`); hover on "Home" → `hover:text-accent` broken → computed `rgb(168,180,204)` gray, **no accent feedback**.
- Adjustment: `--color-accent` fix. Optionally keep hover as-is after fix.

**Filters (88%)** — Screenshot: `products-1280px-live.png` (EngineBar row).
- LEFT: active mode pill ("All Results") solid accent; inactive pills transparent.
- RIGHT: active pill class `bg-accent` → **transparent** (`rgba(0,0,0,0)`, white text floating); geo chips fine ("Pan India" active via inline `#3D8BFF18`).
- Adjustment: `--color-accent` fix.

**Cards (93%)** — Screenshot: `products-1280px-live.png` (grid).
- LEFT: 22px-radius surface cards, orange-filled rating star, accent icons, accent underline hover.
- RIGHT: geometry ✅ (radius 22px, bg `#00072D`, border-border `#ffffff12`); Buy/RFQ/Chat/Save/Cmp/Info action bar ✅ (inline `var(--accent)` → Buy 12% tint + `#FF7A33` text renders correctly); rating star `fill-accent text-accent` → fill falls back to `none`, color white → **outline white star instead of orange-filled**; card hover underline accents broken.
- Adjustment: `--color-accent` fix.

**Typography (90%)** — Screenshot: `products-1280px-live.png`.
- LEFT: kicker accent; title 1.9rem/900; consistent scale with `/companies`.
- RIGHT: title ✅ 30.4px/900; kicker color broken (see Hero). Scale note: `/products` title 30.4px vs `/companies` hero 52px — two listing pages, two title scales (founder decision whether to unify).
- Adjustment: `--color-accent` fix; optional scale unification.

**Trust Signals (90%)** — Screenshot: `products-1280px-live.png` (grid).
- RIGHT: price block ✅ (inline `var(--text-primary)`, discount/save styles work); MOQ/stock badges ✅; star fill broken (see Cards); seller/verified accents broken.
- Adjustment: `--color-accent` fix.

**Premium Feel (88%)** — Cumulative effect of the above accent breakage (kicker, pill, underline, star, hovers). Not a design deviation — a token mapping bug.
- Adjustment: `--color-accent` fix; then re-shoot.

---

## 2. `/companies` — 13-section scorecard

| # | Section | Score | Verdict |
|---|---|---|---|
| 1 | Header | 97% | ✅ |
| 2 | Hero | 82% | 🔴 <95% |
| 3 | Breadcrumb | 92% | ⚠️ <95% |
| 4 | Search | 80% | 🔴 <95% |
| 5 | Filters | 95% | ✅ |
| 6 | Cards | 90% | ⚠️ <95% |
| 7 | Typography | 90% | ⚠️ <95% |
| 8 | Spacing | 97% | ✅ |
| 9 | Trust Signals | 92% | ⚠️ <95% |
| 10 | CTA hierarchy | 80% | 🔴 <95% |
| 11 | Empty State | 100% | ✅ |
| 12 | Mobile | 97% | ✅ |
| 13 | Premium Feel | 85% | ⚠️ <95% |

### <95% items — screenshot + reason + adjustment

**Hero (82%)** — Screenshot: `companies-1280px-live.png` (top).
- LEFT: hero title 52px/900, kicker accent chip, gradient mesh, accent underline.
- RIGHT: h1 "Find Verified Tradors" 52px/900 `#f0f4ff` ✅; kicker "Tradors Directory" → computed `rgb(240,244,255)` (white chip, not accent); **primary Search CTA invisible** (see Search).
- Adjustment: `--color-accent` fix.

**Search (80%)** — Screenshot: `companies-1280px-live.png` (hero).
- LEFT: solid orange `Search` button (page's primary CTA).
- RIGHT: class `px-6 py-3 rounded-2xl font-bold text-sm bg-accent text-btn-primary-text` → computed **`backgroundColor: rgba(0,0,0,0)`, no background-image** → a floating white "Search" text on the dark hero with no button surface. This is the single most visible defect of P0.7.
- Adjustment: `--color-accent` fix → renders solid `#FF4D00` with white text.

**Breadcrumb (92%)** — same cause as `/products` (hover `rgb(168,180,204)`). Adjustment: §0 fix.

**Cards (90%)** — Screenshot: `companies-1280px-live.png` (directory grid).
- LEFT: 16px-radius surface cards, orange-filled star, accent icons, neon glow hover.
- RIGHT: geometry ✅ (radius 16px, bg `#00072D`, border `#ffffff12`, Elite badge inline gold renders ✅, Trust Score bar inline gradient ✅); rating star `fill-accent` → fill `none`, color white → **outline white star**; MapPin/Package/Zap `text-accent` → white; `group-hover:text-accent` on company name/arrow → no accent.
- Adjustment: `--color-accent` fix.

**Typography (90%)** — kicker color (see Hero). Title scale 52px ✅. Adjustment: §0 fix.

**Trust Signals (92%)** — "Trust Score 0" label + shield ✅ (inline colors); rating star fill broken (see Cards); "Verified" badge not visible on seed companies (data — seed rows are Elite but `isVerified` false; VerifiedBadge renders when true, code verified at `CompanyCard.tsx:91`).
- Adjustment: `--color-accent` fix; seed data option (mark seed companies verified) — founder decision.

**CTA hierarchy (80%)** — Invisible primary Search CTA + secondary chips fine. Screenshot: `companies-1280px-live.png`. Adjustment: §0 fix.

**Premium Feel (85%)** — cumulative accent breakage. Adjustment: §0 fix.

---

## 3. Cross-page verification (P0.6 detail page)

- `products-1280px-live.png` + `detail-live.png` — `Buy / Place Order` (PremiumProductDetailClient.tsx:645) uses `bg-accent text-text-on-accent shadow-accent/20` → **transparent button with white text** (P0.6 approved on structure; color layer carries the same bug).
- `bg-accent/10` + `border-accent/20` chips on detail page → **transparent** (measured `rgba(0,0,0,0)`).
- `Request Call / RFQ` (bg-bg-elevated) renders correctly ✅.
- Adjustment: `--color-accent` fix restores all P0.6 accents without touching P0.6 code.

---

## 4. Required adjustments (implementation blocked pending founder approval)

1. **`globals.css:338`** — `--color-accent-DEFAULT: var(--accent);` → `--color-accent: var(--accent);` (single-line fix; restores every <95% item on both pages + P0.6 detail).
2. **Re-verify** after fix: kickers `#FF4D00`, `/companies` Search solid orange, EngineBar "All Results" pill orange, SectionHeading underline visible, detail Buy CTA solid, card stars orange-filled.
3. **Founder decision (non-blocking):** unify listing-page title scale (`/products` 30.4px vs `/companies` 52px); optionally mark seed companies verified to exercise VerifiedBadge.

**No code was modified. All scores derive from measured computed styles (evidence-live.json, precision-probe.json) and screenshots in `docs/review/P0.7-VISUAL-AUDIT/`.**

---

## 5. DECISION 1 IMPLEMENTED — Design Token fix

**Change (single line, `apps/web/app/globals.css` @theme block):**
```diff
-  --color-accent-DEFAULT: var(--accent);
+  --color-accent: var(--accent);
```
Tailwind v4 now generates the bare `accent` namespace: `bg-accent`, `text-accent`, `border-accent`, `fill-accent`, `from-accent`, `to-accent`, and opacity variants (`bg-accent/10`, `bg-accent/15`, `border-accent/20`, …). All existing components inherit automatically. No other file changed. No orange hardcoded.

**Verification — `next build` ✅** (Compiled in 54s, TypeScript clean, 293 routes).

**Playwright after-state (computed styles, live stack) — all 5 proofs PASS** (`docs/review/P0.7-VISUAL-AUDIT/after-verification.json`):

| Proof | Before | After |
|---|---|---|
| Token `--color-accent` | MISSING | `#ff4d00` ✅ |
| **CTA visible** (`/companies` Search) | `rgba(0,0,0,0)` transparent | solid `rgb(255,77,0)` + white text ✅ (desktop + mobile) |
| **Rating stars orange** (`/companies` + `/products` cards) | fill `none` / white | fill + color `rgb(255,77,0)` ✅ |
| **Accent chips visible** (detail page `bg-accent/10`, `border-accent/20`) | transparent | accent at 10% tint ✅; `Buy / Place Order` CTA solid orange ✅ |
| **Underlines visible** (SectionHeading `from-accent via-accent-amber to-transparent`) | invalid gradient → invisible | `rgb(255,77,0) → rgb(245,158,11) → transparent`, 56px ✅ |
| **Breadcrumb hover** (`hover:text-accent`) | `rgb(168,180,204)` gray | `rgb(255,77,0)` ✅ |
| Kickers ("Discovery Engine" / "Tradors Directory") | near-white | `rgb(255,77,0)` ✅ |
| EngineBar active pill ("All Results") | transparent | accent 15% tint + accent text ✅ |

**Screenshots:** before → `companies-1280px-live.png`, `products-1280px-live.png`, `detail-live.png`; after → `companies-1280px-after.png`, `products-1280px-after.png`, `companies-390px-after.png`, `detail-after.png`, `breadcrumb-hover-after.png`.
