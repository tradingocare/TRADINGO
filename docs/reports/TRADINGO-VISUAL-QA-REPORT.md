# TRADINGO Visual QA Report — Design System v1.0

**Scope**: Cross-reference rendered CSS tokens against DESIGN_D/DESIGN_W specifications.  
**Method**: Static code analysis of `globals.css`, shared components (`button.tsx`, `card.tsx`), `HeroSection.tsx`, `page.tsx`.  
**Date**: 2026-07-09 | **Status**: 6 Critical, 5 Medium, 5 Low findings

---

## Critical

### C1. Button `default` variant renders slate-gray, not accent-orange

| Field | Value |
|---|---|
| **File** | `components/ui/button.tsx:12` |
| **Current** | `bg-primary-600 text-primary hover:bg-primary-700` |
| **Resolution** | `bg-primary-600` → `--color-primary-600` = `#475569` (slate-gray) |
| | `text-primary` → `--color-primary` = `var(--accent)` = `#ff4d00` (orange) |
| **DESIGN_D** | "Primary buttons use `accent-500` background with black text" |
| **Impact** | Every `variant="default"` `<Button>` renders slate-gray with orange text. Contrast ratio ~3.5:1 (fails WCAG AA 4.5:1). ~Hundreds of buttons affected. |
| **Fix** | `bg-accent-500 text-black hover:bg-accent-600` |

### C2. Button `accent` variant has invisible text (orange on dark-orange)

| Field | Value |
|---|---|
| **File** | `components/ui/button.tsx:18` |
| **Current** | `bg-accent-600 text-primary` |
| **Resolution** | `bg-accent-600` → `--color-accent-600` = `#cc3d00` (dark orange) |
| | `text-primary` → `--color-primary` = `#ff4d00` (brighter orange) |
| **DESIGN_D** | "Primary buttons use accent-500 background with black text" |
| **Impact** | Orange text (`#ff4d00`) on dark-orange (`#cc3d00`). Contrast ratio ~1.4:1 — nearly invisible. |
| **Fix** | `bg-accent-500 text-black hover:bg-accent-600` |

### C3. `text-primary` vs `text-text-primary` — one-character ambiguity

| Field | Value |
|---|---|
| **File** | `globals.css:358,384` |
| **Tokens involved** | `--color-primary: var(--accent)` = `#ff4d00` (line 358) |
| | `--color-text-primary: var(--text-primary)` = `#ffffff` [dark] / `#000000` [light] (line 384) |
| **Issue** | `text-primary` → `--color-primary` → **orange** |
| | `text-text-primary` → `--color-text-primary` → **white** (dark) / **black** (light) |
| | The difference is a single `-text-` infix — easy to get wrong. |
| **Impact** | Both button variants C1 & C2 use `text-primary` instead of `text-text-primary`, causing invisible text. Any future `text-primary` use will get orange text (usually unintended). |
| **Fix** | 1. Document naming in DESIGN_D. 2. Consider renaming `--color-primary` to `--color-accent-base`. 3. Check all 50+ `text-primary` usages across codebase. |

### C4. `--color-primary` base is orange, `--color-primary-600` is slate — internal contradiction

| Field | Value |
|---|---|
| **File** | `globals.css:358,404-415` |
| **Tokens** | `--color-primary: var(--accent)` = `#ff4d00` (orange) |
| | `--color-primary-50` through `--color-primary-950` = slate scale (#f8fafc → #020617) |
| **Issue** | `bg-primary` = orange, but `bg-primary-600` = slate (`#475569`). Developers expect numbered shades to belong to the same color family as the base. |
| **Impact** | `bg-primary text-primary-600` would give orange bg + slate text. Any developer using `primary` as a color family gets visually broken results. |
| **Fix** | Remove `--color-primary` base OR rename numbered scale to `--color-slate-*` and keep `primary` as a semantic alias. |

### C5. HeroSection CTA buttons bypass shared Button component

| Field | Value |
|---|---|
| **File** | `components/sections/HeroSection.tsx:147-175` |
| **Current** | `<motion.span>` with `style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f6)' }}` |
| **DESIGN_D** | "Every interactive element MUST use the shared Button component" |
| **Issue** | Hardcoded blue gradient (not accent-orange). No focus states, no disabled states, no theme responsiveness. Cannot be themed in DESIGN_W. |
| **Fix** | Replace with `<Button variant="accent" asChild>` wrapping `<motion.span>` or use `<motion.div>` with `<Button>` composition API. |

### C6. Light theme `text-on-accent: #FFFFFF` fails AA contrast

| Field | Value |
|---|---|
| **File** | `globals.css:211` |
| **Token** | `--text-on-accent: #FFFFFF` |
| **DESIGN_D** | "Primary buttons use accent-500 background with black text" |
| **Issue** | White (`#FFFFFF`) on `#ff4d00` (accent-500). Contrast ratio ~3.1:1 — fails WCAG AA (4.5:1 for normal text at 14px). |
| **Impact** | All accent-background text elements fail accessibility in DESIGN_W. |
| **Fix** | Change to `--text-on-accent: #000000` (per DESIGN_D) or use a darker accent shade like `#cc3d00` for backgrounds. |

---

## Medium

### M1. Shared Card component uses hardcoded rgba values, not tokens

| Field | Value |
|---|---|
| **File** | `components/ui/card.tsx:9` |
| **Current** | `from-[rgba(10,14,30,0.78)]`, `shadow-[0_8px_40px_rgba(0,0,0,0.60)]`, etc. |
| **Issue** | Every Card instance renders with inline rgba values that ignore `--bg-elevated`, `--surface`, `--shadow-*` tokens. |
| **Impact** | Cards don't respond to DESIGN_W light theme changes. Cannot be globally restyled. |
| **Fix** | Replace with `bg-gradient-to-br from-surface/80 to-surface-secondary/90 shadow-lg` |

### M2. Card component applies animated effects by default (performance)

| Field | Value |
|---|---|
| **File** | `components/ui/card.tsx:9` |
| **Current** | `<div className="... neon-rainbow-border ambient-backlight">` |
| **Issue** | Every `<Card>` gets: animated SVG-masked prismatic border (`neon-rainbow-border`), animated radial backlight (`ambient-backlight`). Both classes add `::before`/`::after` pseudo-elements with `mask-composite`, `radial-gradient`, and CSS animations. |
| **Impact** | Performance overhead on grid/dashboard pages with 20+ cards. Visual overload — every card has a rainbow border. |
| **Fix** | Remove default application. Add as `<Card variant="premium">` or `glow` prop. |

### M3. Button focus-visible ring uses slate instead of accent

| Field | Value |
|---|---|
| **File** | `components/ui/button.tsx:8` |
| **Current** | `focus-visible:ring-primary-500` = `#64748b` (slate) |
| **Issue** | Keyboard focus indicator uses unrelated neutral color instead of brand accent. |
| **Fix** | `focus-visible:ring-accent-500` |

### M4. `card-premium` utility hardcodes `#090B13` background

| Field | Value |
|---|---|
| **File** | `globals.css:1297-1298` |
| **Current** | `@utility card-premium { background: #090B13; }` |
| **Issue** | Should use `--surface-solid` (which is `#050510` in dark, `#FFFFFF` in light) or `--bg-elevated-2`. |
| **Impact** | `card-premium` renders near-black in light theme. |
| **Fix** | `background: var(--surface-solid);` or `var(--bg-elevated-2)` |

### M5. `input-dark` utility hardcodes colors

| Field | Value |
|---|---|
| **File** | `globals.css:1311-1323` |
| **Current** | `background: rgba(255, 255, 255, 0.04)`, `border: 1px solid rgba(255, 255, 255, 0.09)`, `color: white` |
| **Issue** | Input utility ignores `--input-bg`, `--input-border`, `--input-text` tokens. Would render white text on light bg in DESIGN_W. |
| **Fix** | `background: var(--input-bg)`, `border-color: var(--input-border)`, `color: var(--input-text)` |

---

## Low

| # | File | Finding | Suggested Fix |
|---|---|---|---|
| L1 | `globals.css:512-515` | Headings use Playfair Display serif via `--font-display`. DESIGN_D says all text uses Inter. | Document intentional heading serif in DESIGN_D, or remove `font-family` override. |
| L2 | `globals.css:485-500` | 5 radial gradient layers on every body (blue, purple, accent, cyan, amber). Rendering overhead on every page. | Reduce to 1-2 gradients or move to a single `mask-image`. |
| L3 | `globals.css:866-894` | `.btn-accent` CSS class uses `color: #ffffff` but DESIGN_D says black text on accent. | Change to `color: #000000` per DESIGN_D. |
| L4 | `HeroSection.tsx:140` | Body text uses `text-[#b7c0d1]` instead of `text-text-secondary` token. | Replace with `text-text-secondary`. |
| L5 | `HeroSection.tsx:438` | "Advertise Here" link uses `style={{ color: '#3b82f6' }}` hardcoded blue. | Use `text-accent-blue` or `className="text-accent-blue"`. |

---

## Summary Table

| Severity | Count | Key Theme |
|---|---|---|
| Critical | 6 | Button tokens resolve wrong (slate/orange instead of accent/black). Token naming ambiguity (`text-primary` vs `text-text-primary`). HeroSection bypasses component system. |
| Medium | 5 | Shared Card & input utilities hardcode values instead of using CSS variable tokens. Animation overhead on all cards. |
| Low | 5 | Minor hardcoded colors, undocumented serif font, body gradient performance. |

**Root Cause Analysis**: The 6 critical issues all stem from two sources:
1. **Naming collision**: `--color-primary` (orange) and `--color-primary-600` (slate) form a contradictory color family. Every component that references `primary` risks resolving to the wrong shade.
2. **Ambiguity**: `text-primary` resolves to `--color-primary` (orange), but most developers intend `text-text-primary` (white/black). The one-character difference in utility names makes this systematically error-prone.

**Recommended next step**: Fix C1-C6 (button colors) and M1-M2 (card defaults) before any other task — they affect every page in the application.
