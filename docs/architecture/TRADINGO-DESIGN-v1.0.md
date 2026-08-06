# TRADINGO Design System v1.0

> **Status:** FROZEN — 09 July 2026  
> **Version:** 1.0.0  
> **Approval:** Founder-approved, Design Freeze active

---

## Executive Summary

TRADINGO Design System v1.0 is the official visual and interaction standard for the TRADINGO® platform. It defines every color token, typography scale, spacing unit, component variant, and motion guideline used across the buyer marketplace, seller workspace, admin console, and public pages.

The design system is built on three pillars:

1. **Dark-First Architecture** — All surfaces default to dark backgrounds (`#0B0D18` primary, `#0F1221` secondary, `#151929` tertiary). Light mode is a derived layer, not the default.
2. **Accent Brand Identity** — A single brand accent (`#FF4D00` / `var(--accent)`) drives all brand-affirmative UI: CTAs, active states, highlights, badges, and gradients. No secondary brand color exists.
3. **Token-Driven Consistency** — Every visual property is expressed as a CSS custom property or Tailwind theme token. Hardcoded hex values and arbitrary Tailwind classes are banned for all new code.

### Key Metrics

| Metric | Value |
|--------|-------|
| CSS custom properties | 56 (globals.css) |
| Tailwind theme tokens | 60+ (primary-50→950, accent-50→950, gray-50→950, status scale) |
| Shared UI components | 23 (Button, Card, Input, Badge, Table, etc.) |
| Files migrated | 280+ |
| Total replacements | 1,200+ |
| Hardcoded `#FF4D00` remaining | 30 (all exempt runtime config) |
| Build routes | 248 |
| TypeScript errors | 0 |

---

## Design Philosophy

### DESIGN_D (Design Decisions)

01. **One accent, everywhere.** Use `accent-500` for all primary actions, active states, highlights, and positive affordances. There is no secondary accent color.

02. **Dark is the canvas.** Light backgrounds (`bg-surface` variants) are the exception, not the rule. Never use pure white for large background areas.

03. **Glass is a layer, not a container.** The glass effect (`backdrop-blur-xl`, semi-transparent backgrounds) is used for overlays, navbars, and floating elements — never for primary content containers.

04. **Gradients are accent-led.** All gradients must originate from `accent-500` and blend to cyan/blue/purple. Never use accent-to-accent solid gradients.

05. **Borders are subtle.** Default border color is `border-border` (`rgba(255,255,255,0.08)`). Active/focused borders use `border-accent-500/40`.

06. **Typography is functional.** All text uses the Inter font family. Headings use `font-black` or `font-bold`. Body uses `font-normal`. Never use italic for emphasis.

07. **Spacing is 4px-based.** All margin/padding values follow the 4px grid (p-1=4px, p-2=8px, p-3=12px, p-4=16px, etc.).

08. **Status colors have fixed meaning.** Green = success/completed. Red = error/cancelled. Yellow/amber = warning/pending. Blue = info/negotiation. Purple = feature/premium.

09. **Radius is standard.** Default border radius is `rounded-xl` (12px). Cards use `rounded-2xl` (16px). Buttons use `rounded-xl`. Inputs use `rounded-xl`. Never mix radii in the same component group.

10. **Animations are optional.** All animations must respect `prefers-reduced-motion`. Transitions default to 200ms ease. Never animate layout properties that cause repaint (use transforms and opacity only).

### DESIGN_W (Design Warnings)

W01. **Never import `lucide-react` icons with arbitrary colors.** Use `text-accent-500` or `text-{semantic}` classes. Inline `color: '#FF4D00'` on icons is forbidden in all new code.

W02. **Never use `bg-white` as a background token.** Use `bg-surface`, `bg-surface-secondary`, or `bg-surface-tertiary` depending on elevation.

W03. **Never inline `#FF4D00`.** Use `var(--accent)` in CSS-in-JS or `text-accent-500`/`bg-accent-500` in classes. The only exceptions are runtime configuration palettes.

W04. **Never create new color tokens.** All colors must be expressed via existing CSS variables or Tailwind theme tokens. If a new semantic token is needed, add it to `globals.css` AND `tailwind.config.ts` AND this document.

W05. **Never use `primary-*` for brand accent.** The `primary-*` scale (slate) is for structural/neutral UI. The `accent-*` scale (orange) is for brand-affirmative UI. Mixing them was the largest single class of design debt.

W06. **Never override component base styles.** If a component needs a variant, add a prop. Never use `!important` or deep selectors to override component styles.

W07. **Never use `text-white` on the default body background (`#DBF1FD` light blue / `#0B0D18` dark).** Use `text-gray-*` or `text-primary` / `text-text-primary` tokens.

---

## Theme Switching Architecture

The theme system uses a three-layer architecture:

### Layer 1: CSS Custom Properties (`globals.css`)

```css
:root {
  --accent:       #FF4D00;
  --accent-light: #FF7A33;
  --accent-dark:  #E04400;
  --surface:      #0B0D18;
  --surface-secondary: #0F1221;
  --surface-tertiary:  #151929;
  --text-primary:    #F8FAFC;
  --text-secondary:  #CBD5E1;
  --text-tertiary:   #64748B;
  --border:          rgba(255, 255, 255, 0.08);
}
```

### Layer 2: Tailwind `@theme` Block (`globals.css`)

The `@theme` directive maps CSS variables to Tailwind utility classes:

```css
@theme {
  --color-accent-50:  #FFF3ED;
  --color-accent-100: #FFE6D4;
  --color-accent-200: #FFCCA8;
  --color-accent-300: #FFB37D;
  --color-accent-400: var(--accent-light);
  --color-accent-500: var(--accent);
  --color-accent-600: var(--accent-dark);
  --color-accent-700: #C93B00;
  --color-accent-800: #A32F00;
  --color-accent-900: #7A2300;
  --color-accent-950: #4D1500;
  /* ... primary-50→950 (slate), gray-50→950, status colors */
}
```

### Layer 3: Tailwind Config (`tailwind.config.ts`)

```ts
theme: {
  extend: {
    colors: {
      accent: {
        DEFAULT: '#FF4D00',
        50: '#FFF3ED', 100: '#FFE6D4', /* ... */
      },
      surface: {
        DEFAULT: '#0B0D18',
        secondary: '#0F1221',
        tertiary: '#151929',
      },
    },
  },
}
```

### Switching Between Themes

Dark mode is the default. Light mode uses the `.light` class on `<html>`:

```css
.light {
  --surface: #F8FAFC;
  --text-primary: #0F172A;
  /* ... overrides for all tokens */
}
```

The `globals.css` `@media (prefers-color-scheme: light)` automatically applies `.light` on user preference.

---

## Component Philosophy

1. **Every component in `components/ui/` is shared.** If a component exists there, it must be used instead of recreating the pattern.
2. **Components accept `className` for override.** Use `cn()` to merge default classes with consumer classes.
3. **Loading, empty, and error states are mandatory.** Every data-driven component must handle all three states.
4. **No component is coupled to a specific domain.** UI components cannot import API hooks or store references.
5. **Variants over props proliferation.** Use `variant="primary|secondary|ghost|danger"` instead of boolean flags.

---

## Accessibility Principles

- All interactive elements must be keyboard accessible (tabIndex, onKeyDown for Enter/Space).
- Color is never the sole indicator of state — use icons, text labels, or underlines alongside color.
- Contrast ratio minimum: 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+ regular).
- Focus indicators use `ring-2 ring-accent-500/50 ring-offset-2 ring-offset-surface`.
- `prefers-reduced-motion` disables all non-essential animations.
- Images must have `alt` text. Decorative images use `alt=""`.
- Form inputs must have associated `<label>` elements.

---

## Typography Hierarchy

| Element | Class | Size | Weight | Line Height | Usage |
|---------|-------|------|--------|-------------|-------|
| Display | `text-4xl lg:text-5xl font-black` | 36–48px | 900 | 1.1 | Hero headings |
| H1 | `text-3xl font-black` | 30px | 900 | 1.2 | Page titles |
| H2 | `text-2xl font-bold` | 24px | 700 | 1.3 | Section headings |
| H3 | `text-xl font-bold` | 20px | 700 | 1.4 | Card titles |
| H4 | `text-lg font-semibold` | 18px | 600 | 1.4 | Subsection titles |
| Body | `text-sm` | 14px | 400 | 1.5 | Default body text |
| Small | `text-xs` | 12px | 400 | 1.5 | Labels, captions, metadata |
| Tiny | `text-[10px]` or `text-[11px]` | 10–11px | 600 | 1.4 | Badges, stat numbers |
| Mono | `font-mono text-xs` | 12px | 400 | 1.5 | Code, IDs, timestamps |

Font family: `'Inter', system-ui, -apple-system, sans-serif` (applied globally).

---

## Elevation & Shadows

| Level | Class | Usage |
|-------|-------|-------|
| 0 | `shadow-none` | Default flat surfaces |
| 1 | `shadow-sm` | Cards on surface |
| 2 | `shadow-md` | Dropdowns, popovers |
| 3 | `shadow-lg` | Modals, drawers |
| 4 | `shadow-xl` | Tooltips, toasts |
| 5 | `shadow-2xl` | Notifications overlay |

Custom shadow tokens (defined in `tailwind.config.ts`):
- `shadow-glow-accent`: `0 0 20px rgba(255, 77, 0, 0.15)` — keyboard focus rings
- `shadow-glow-cyan`: `0 0 20px rgba(0, 255, 255, 0.1)` — glass elements

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Buttons, inputs, small elements |
| `rounded-xl` | 12px | Default radius, cards, dropdowns |
| `rounded-2xl` | 16px | Large cards, modals |
| `rounded-3xl` | 24px | Hero sections, feature boxes |
| `rounded-full` | 9999px | Badges, avatars, pills |

---

## Motion Guidelines

| Property | Duration | Easing | Usage |
|----------|----------|--------|-------|
| Hover | 150ms | ease-out | Button/icon hover states |
| Enter | 200ms | ease-out | Element appearing |
| Exit | 150ms | ease-in | Element disappearing |
| Layout | 300ms | ease-in-out | Collapse/expand |
| Page transition | 300ms | ease-in-out | Route changes |

**Golden rule:** Only animate `opacity` and `transform`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`.

---

## Glass Guidelines

Glass surfaces use a consistent formula:

```css
background: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
```

Available via the `glass` utility class or inline. Glass is appropriate for:
- Floating navigation bars
- Modal overlays
- Dropdown menus
- Tooltip backgrounds

Glass is NOT appropriate for:
- Page-level backgrounds
- Card content areas
- Form inputs
