# TRADINGO® Enterprise Design Language v1.0

> **Status**: FROZEN — Founder Approved  
> **Last Updated**: 2026-07-07  
> **Scope**: Global — applies to all pages, components, and future development  
> **Phase**: T-2.3 — Enterprise Design Language Freeze  
> **Next Phase**: T-3 — Component Migration

---

## Table of Contents

1. Design Principles
2. Glass Morphism System
3. Hover System
4. Google Premium Rainbow Hover
5. Motion System
6. Elevation System
7. Shadow Tokens
8. Blur Tokens
9. Border System
10. Radius System
11. Typography Rules
12. Button Rules
13. Input Rules
14. Card Rules
15. Table Rules
16. Dashboard Rules
17. Modal Rules
18. Drawer Rules
19. Navigation Rules
20. Sidebar Rules
21. Header / Footer Rules
22. Status Chips
23. Badges
24. Empty States
25. Skeleton Loaders
26. Charts
27. Icon Style
28. Responsive Rules
29. Accessibility Rules
30. Animation Duration Standards
31. Future Component Rules

---

## 1. Design Principles

### Core Identity

TRADINGO is a **dark-first, prismatic glass platform**. All surfaces are luminous, layered, and depth-rich. Light mode (DESIGN_W) is a secondary citizen — it exists for accessibility and preference but the soul of the platform is its dark canvas.

### The Five Pillars

| Pillar | Description |
|--------|-------------|
| **Depth** | Every surface has hierarchy. Cards stack, glass layers blur, shadows separate. Nothing is flat. |
| **Light** | Surfaces emit and reflect light. Backlight glow, prismatic borders, and radial spotlights simulate physical materials. |
| **Motion** | Every transition serves a purpose. Micro-interactions confirm actions. Animations guide attention without delay. |
| **Clarity** | Typography is crisp on glass. Status is instant via color. Information hierarchy is visual, not decorative. |
| **Consistency** | One card pattern. One button language. One elevation system. No variations across modules. |

### Token-First Architecture

Every visual property derives from a CSS variable. Hardcoded colors are forbidden. The `@theme` block maps CSS variables to Tailwind utilities so all components respond to DESIGN_D (dark) / DESIGN_W (light) without code changes.

### Dark = Default, Light = Derived

DESIGN_D is the primary theme authored in `:root`. DESIGN_W overrides in `html[data-theme="light"]`. The light theme is not a redesign — it inverts luminance while preserving all semantic relationships (accent, status, elevation, glass).

---

## 2. Glass Morphism System

### Philosophy

Glass in TRADINGO is not decorative frosted glass — it is **prismatic composite glass** with multiple layers of color, blur, and edge detail. A TRADINGO glass surface combines:

1. A **gradient base** (diagonal, 135–160deg, 2–3 stops)
2. A **backdrop blur** (16–40px, saturate 1.4–2.0)
3. A **subtle top-edge highlight** (inset white stroke)
4. A **bottom-edge shadow** (inset dark stroke)
5. A **prismatic neon border** (revealed on hover)
6. An **ambient backlight** (under-card colored glow)

### Glass Card Hierarchy

| Class | blur() | saturate | brightness | border-radius | Use Case |
|-------|--------|----------|------------|---------------|----------|
| `.glass-card-subtle` | 16px | 1.4 | 1.0 | 14px (0.875rem) | Secondary cards, compact surfaces |
| `.glass-card` | 24px | 1.6 | 1.08 | 16px (1rem) | Standard cards, stat cards, content panels |
| `.glass-card-neon` | 28px | 1.8 | 1.0 | 16px (1rem) | Cards with animated neon bottom-edge glow |
| `.glass-card-elevated` | 32px | 1.8 | 1.1 | 20px (1.25rem) | Primary cards, hero panels, modal content |
| `.glass-panel-prism` | 40px | 2.0 | 1.0 | 24px (1.5rem) | Hero sections, feature panels, large containers |
| `.compact-stack-card` | 24px | 1.7 | 1.05 | 16px (1rem) | Product cards, company cards, discovery cards |

### Glass Composition Rules

- **Every glass card** MUST have `position: relative; isolation: isolate`
- **`::before`** is the spotlight/sheen layer (mouse-track radial gradient)
- **`::after`** is the neon border layer (mask-composite excluded prismatic ring)
- **On hover**: `translateY(-2px to -4px)`, border brightens, neon opacity → 1, shadow intensifies

### Glass Input

`.glass-input` is the standard form field:
- `backdrop-filter: blur(16px)`
- `border-radius: 9999px` (pill)
- Focus: blue neon border (`rgba(0, 180, 255, 0.45)`) with 3px ring + 32px blur shadow
- Placeholder: `var(--text-tertiary)`

### Glass Nav

`.premium-nav-capsule` is the main navigation pill:
- Multi-radial gradient background (orange + amber hotspots)
- `backdrop-filter: blur(32px) saturate(1.6)`
- `border-radius: 9999px`
- `::before` = top glass sheen
- `::after` = animated light sweep (`navGlassShine` 9s)

### Glass Utility

`.glass` utility class provides a quick glass surface:
- `background: rgba(10, 14, 26, 0.80)`
- `backdrop-filter: blur(16px) saturate(1.5)`
- `border: 1px solid rgba(255, 255, 255, 0.07)`

---

## 3. Hover System

### Interaction Model

TRADINGO uses a **depth-response** model: interactive elements rise toward the user on hover. The response is proportional to the element's baseline elevation.

### Standard Hover Properties

| Property | Value | Token |
|----------|-------|-------|
| Translate Y | -2px | `--hover-translate-y` |
| Brightness | 1.05 | `--hover-brightness` |
| Duration | 0.22–0.32s | See §30 |
| Easing | cubic-bezier(0.22, 0.61, 0.36, 1) | — |

### Component-Specific Hover Behaviors

| Component | Translate Y | Scale | Border Change | Shadow Change |
|-----------|-------------|-------|---------------|---------------|
| Glass card (subtle) | -2px | none | brighten 0.05→0.10 | +30% depth |
| Glass card (standard) | -3px | 1.002 | brighten 0.07→0.15 | +70% depth, neon reveal |
| Glass card (elevated) | -4px | 1.003 | brighten 0.08→0.16 | +100% depth, prism reveal |
| Compact stack card | -4px | none | brighten 0.08→0.16 | dual stack spreads, neon reveal |
| Button (accent) | -2px | none | — | glow intensifies |
| Button (glass) | -2px | none | blue border appears | glow appears |
| Feature mini box | -2px | none | brighten 0.05→0.12 | +50% depth |
| Image/thumbnail | none | 1.05 | — | — |

### Hover Color Tokens

Every interactive element that changes border color on hover MUST use `var(--glow-border-hover)` or a `--color-*` token. Direct hardcoded colors are forbidden.

---

## 4. Google Premium Rainbow Hover

### The TRADINGO Rainbow

TRADINGO's rainbow is not a toy — it is a **premium quality signal**. It appears on cards that represent the highest-value surfaces in the platform: product discovery, company profiles, professional cards, and dashboard stat cards.

### Prism Gradient

The prismatic border is a 6-stop linear gradient:

```
--prism-gradient: linear-gradient(135deg,
  rgba(0, 180, 255, 0.65),   /* neon-blue */
  rgba(168, 85, 247, 0.55),  /* neon-purple */
  rgba(247, 37, 133, 0.50),  /* neon-pink */
  rgba(255, 170, 0, 0.45),   /* neon-amber */
  rgba(6, 255, 200, 0.55),   /* neon-cyan */
  rgba(0, 180, 255, 0.65)    /* neon-blue */
);
background-size: 300% 300%;
animation: prismSpin 6s linear infinite;
```

### `neon-rainbow-border` Utility

A standalone CSS class that adds the prismatic border as a `::after` pseudo-element:
- `inset: -1.5px`
- `mask-composite: exclude`
- `opacity: 0.3` (visible by default, subtle)
- `opacity: 1` on hover

### When to Use Rainbow Border

| ✅ Required | ❌ Do Not Use |
|---|---|
| Product/Company/Professional discovery cards | Form inputs |
| Dashboard stat cards | Navigation items |
| Feature/benefit cards | Table rows |
| Hero/panel sections | Modal content |
| Premium tier elements | Footer elements |

---

## 5. Motion System

### Core Philosophy

Motion is **informational, not decorative**. Every animation answers a question: Where did this come from? What happened? What should I do next?

### Animation Keyframe Registry

All animations live in `@keyframes` blocks in `globals.css`. No inline keyframes in components.

| Keyframe | Purpose | Duration | Easing |
|----------|---------|----------|--------|
| `fadeIn` | Entry opacity | 0.6s | ease-out |
| `slideUp` | Content reveal | 0.6s | ease-out |
| `slideDown` | Dropdown/menu | 0.4s | ease-out |
| `pulse-soft` | Loading/live indicators | 3s | ease-in-out infinite |
| `prismSpin` | Rainbow border rotation | 5–6s | linear infinite |
| `rainbowSpin` | Ornamental rings | varies | linear infinite |
| `prismEdgeSlide` | Top-edge stripe sweep | 4s | linear infinite |
| `prismTextShift` | Gradient text color shift | 5s | ease-in-out infinite |
| `backlightPulse` | Under-card glow breathing | 3.6–5s | ease-in-out infinite |
| `navGlassShine` | Light sweep across nav | 9s | ease-in-out infinite |
| `navActivePulse` | Active nav glow pulse | 2.8s | ease-in-out infinite |
| `navUnderlineShimmer` | Shimmer underline | 3s | linear infinite |
| `lightSweep` | Diagonal light sweep | 8s | ease-in-out infinite |
| `shimmer` | Loading skeleton | 1.5s | linear infinite |
| `globeRotate` | Decorative globe | 18s | linear infinite |
| `countUp` | Number counters | varies | ease-out |

### Tailwind Animation Utilities

| Utility | Keyframe Reference |
|---------|-------------------|
| `animate-fade-in` | `fadeIn` |
| `animate-slide-up` | `slideUp` |
| `animate-slide-down` | `slideDown` |
| `animate-pulse-soft` | `pulse-soft` |
| `animate-nav-shine` | `navGlassShine` |
| `animate-nav-active-pulse` | `navActivePulse` |
| `animate-nav-underline` | `navUnderlineShimmer` |
| `animate-light-sweep` | `lightSweep` |
| `animate-prism-spin` | `prismSpin` |
| `animate-prism-edge` | `prismEdgeSlide` |

### Reduced Motion

A global `@media (prefers-reduced-motion: reduce)` block sets all animation-duration to `0.01ms` and iteration-count to `1`. Components using framer-motion MUST use `useReducedMotion()`.

---

## 6. Elevation System

### Elevation Layers

TRADINGO defines 4 elevation layers, from deepest (background) to highest (modal).

| Layer | z-index Range | Elements | Background |
|-------|---------------|----------|------------|
| Canvas | auto | Body, page backgrounds | `--bg-base` / `--bg-elevated` |
| Surface | 0–10 | Cards, panels, sections | Glass composite / `--surface-solid` |
| Floating | 10–40 | Dropdowns, tooltips, toasts | Glass / `--surface-solid-secondary` |
| Overlay | 40–50 | Modals, drawers, full-screen overlays | `--bg-overlay` + backdrop-blur |

### z-index Conventions

| Element | z-index |
|---------|---------|
| Page content | auto |
| Sticky headers | 30 |
| Dropdown menus | 40 |
| Sidebar | 30 |
| Topbar | 40 |
| Modal backdrop | 50 |
| Modal content | 50 |
| Toast / notification | 60 |
| Tooltip | 60 |

---

## 7. Shadow Tokens

### CSS Variable Shadows

| Token | Dark Value | Light Value |
|-------|-----------|-------------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | `0 4px 12px rgba(0,0,0,0.08)` |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.55)` | `0 8px 40px rgba(0,0,0,0.04)` |
| `--shadow-xl` | `0 16px 64px rgba(0,0,0,0.65)` | `0 16px 64px rgba(0,0,0,0.07)` |
| `--card-shadow` | `0 8px 40px rgba(0,0,0,0.55)` | `0 4px 24px rgba(0,0,0,0.04)` |
| `--card-shadow-hover` | `0 16px 64px rgba(0,0,0,0.65)` | `0 8px 32px rgba(0,0,0,0.07)` |
| `--glass-shadow` | `0 8px 40px rgba(0,0,0,0.55)` | `0 4px 24px rgba(0,0,0,0.04)` |
| `--glass-shadow-hover` | `0 16px 64px rgba(0,0,0,0.65)` | `0 8px 32px rgba(0,0,0,0.07)` |

### Tailwind Shadow Mapping

```
--shadow-sm  → shadow-sm
--shadow-md  → shadow-md
--shadow-lg  → shadow-lg
--shadow-xl  → shadow-xl
```

### Shadow Rules

- Shadows in DESIGN_D are deep and dark (heavy black with 0.4–0.65 alpha) to create depth on the dark canvas.
- Shadows in DESIGN_W are light and soft (0.04–0.08 alpha black) for a clean light appearance.
- Hover shadows MUST be at least 1.5× the resting shadow size.
- Never use `box-shadow` directly. Use shadow tokens or Tailwind `shadow-*` utilities.

---

## 8. Blur Tokens

### Backdrop Blur Scale

| Blur | px | Usage |
|------|----|--------|
| `backdrop-blur-sm` | 4px | Overlay backgrounds |
| `backdrop-blur` | 8px | Minimal glass, hover states |
| `backdrop-blur-md` | 12px | Subtle glass surfaces |
| `backdrop-blur-xl` | 24px | **Standard glass** (default for cards, inputs, panels) |
| `backdrop-blur-2xl` | 40px | Elevated glass, prism panels |

### CSS-Level Blur Values

| CSS Class | blur() |
|-----------|--------|
| `.glass` | 16px |
| `.glass-card-subtle` | 16px |
| `.glass-card` | 24px |
| `.glass-card-neon` | 28px |
| `.glass-card-elevated` | 32px |
| `.premium-nav-capsule` | 32px |
| `.glass-panel-prism` | 40px |
| `.compact-stack-card` | 24px |
| Modal overlay | 4–8px |

### Saturate Scale

| Class | saturate() |
|-------|------------|
| `.glass-card-subtle` | 1.4 |
| `.glass-card` | 1.6 |
| `.glass-card-neon` | 1.8 |
| `.glass-card-elevated` | 1.8 |
| `.premium-nav-capsule` | 1.6 |
| `.glass-panel-prism` | 2.0 |
| `.compact-stack-card` | 1.7 |

---

## 9. Border System

### Color Tokens

| Token | Dark Value | Light Value | Tailwind Utility |
|-------|-----------|-------------|-----------------|
| `--border-color` | `rgba(255,255,255,0.07)` | `rgba(148,163,184,0.20)` | `border-border` |
| `--border-light` | `rgba(255,255,255,0.04)` | `rgba(148,163,184,0.12)` | `border-border-light` |
| `--card-border` | `rgba(255,255,255,0.06)` | `rgba(148,163,184,0.15)` | raw CSS var |
| `--card-border-hover` | `rgba(255,255,255,0.14)` | `rgba(255,77,0,0.25)` | raw CSS var |
| `--glass-border` | `rgba(255,255,255,0.06)` | `rgba(148,163,184,0.15)` | raw CSS var |
| `--glass-border-hover` | `rgba(255,255,255,0.14)` | `rgba(255,77,0,0.25)` | raw CSS var |
| `--divider-color` | `rgba(255,255,255,0.06)` | `rgba(148,163,184,0.2)` | `border-divider` |
| `--nav-border` | `rgba(255,255,255,0.08)` | `rgba(148,163,184,0.15)` | `border-nav-border` |

### Neon Border Classes

Single-sided colored border utilities with matching glow shadow:

| Class | Color |
|-------|-------|
| `.neon-border-blue` | `--neon-blue-rgb` (0,180,255) |
| `.neon-border-purple` | `--neon-purple-rgb` (168,85,247) |
| `.neon-border-cyan` | `--neon-cyan-rgb` (6,255,200) |
| `.neon-border-pink` | `--neon-pink-rgb` (247,37,133) |
| `.neon-border-amber` | `--neon-amber-rgb` (255,170,0) |
| `.neon-border-green` | `--neon-green-rgb` (0,255,136) |
| `.neon-border-orange` | `--neon-orange-rgb` (255,77,0) |

### Border Rules

- Every visible surface MUST have a border (1px solid, using a `--*-border` token).
- Glass surfaces: `rgba(white, 0.04–0.08)` in dark, `rgba(slate, 0.12–0.20)` in light.
- Interactive surfaces brighten border on hover by 2–3×.
- `border-color: transparent` is allowed only for ghost buttons and link-style elements.
- The `* { border-color: rgba(255, 255, 255, 0.07); }` base rule provides a universal default.

---

## 10. Radius System

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px (0.25rem) | Small decorative elements |
| `rounded-md` | 6px (0.375rem) | Buttons (small), skeleton defaults |
| `rounded-lg` | 8px (0.5rem) | Buttons (default size), nav items |
| `rounded-xl` | 12px (0.75rem) | **Standard** — cards, inputs, tables, stat boxes |
| `rounded-2xl` | 16px (1rem) | Glass cards, company cards, feature cards |
| `rounded-3xl` | 24px (1.5rem) | Large cards, hero panels, product cards |
| `rounded-full` | 9999px | Pills, badges, buttons, nav capsule, inputs |

### Radius Rules

- The default card radius is `rounded-xl` (12px) for `glass-card-subtle`, `rounded-2xl` (16px) for `glass-card`.
- Discovery cards (products, companies, professionals): `rounded-2xl` or `rounded-3xl`.
- All buttons and nav pills: `rounded-full`.
- Form inputs (non-glass): `rounded-lg` or `rounded-xl`.
- Glass inputs: `rounded-full`.
- Modals: `rounded-2xl`.
- Tables: `rounded-xl` on the container, 0 on cells.
- Custom radii (e.g., `rounded-[22px]`) are reserved for hero/enterprise pages only.

---

## 11. Typography Rules

### Font Stack

| Role | Family | Tailwind Token |
|------|--------|----------------|
| Body / UI | `Inter`, sans-serif | `font-sans` |
| Headings (h1–h4) | `Playfair Display`, serif | `font-display` |

### Type Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-[9px]` | 9px | 600 | Badge labels, tiny chips |
| `text-[10px]` | 10px | 600 | Meta text, filter chips |
| `text-xs` | 12px | 500–600 | Small labels, table cells, stat labels |
| `text-sm` | 14px | 500 | Body text, buttons, inputs |
| `text-base` | 16px | 500 | Standard body |
| `text-lg` | 18px | 600 | Card titles, modal headers |
| `text-xl` | 20px | 700 | Section headers |
| `text-2xl` | 24px | 700–800 | Stat values, card titles |
| `text-3xl` | 30px | 800 | Hero subtitles |
| `text-4xl` | 36px | 800–900 | Hero titles |
| `text-5xl` | 48px | 900 | Major hero headlines |

### Font Weight Rules

| Weight | Usage |
|--------|-------|
| `font-medium` (500) | Body text, most labels |
| `font-semibold` (600) | Buttons, nav items, table headers |
| `font-bold` (700) | Headings, stat values, key labels |
| `font-black` (900) | Page titles, hero CTAs |

### Color Tokens

| Token | Tailwind Utility | Dark Value | Light Value |
|-------|-----------------|------------|-------------|
| `--text-primary` | `text-text-primary` | `#f0f4ff` | `#000000` |
| `--text-secondary` | `text-text-secondary` | `#a8b4cc` | `#374151` |
| `--text-tertiary` | `text-text-tertiary` | `#6b7894` | `#6B7280` |
| `--text-muted` | `text-text-muted` | `#6b7894` | `#6B7280` |
| `--text-on-accent` | `text-text-on-accent` | `#ffffff` | `#ffffff` |

### Text Gradient Utilities

| Utility | Gradient |
|---------|----------|
| `text-gradient` | `#ff4d00 → #ff7a33` (brand accent) |
| `text-gradient-prism` | `#00b4ff → #a855f7 → #f72585 → #06ffc8` (animated) |
| `text-gradient-gold` | `#ffaa00 → #ff7a33 → #f72585` |
| `text-gradient-cyber` | `#06ffc8 → #00b4ff` |

### Typography Rules

- All headings (h1–h4) use `font-display` with `letter-spacing: -0.02em`.
- Body text uses `font-sans` with `-webkit-font-smoothing: antialiased`.
- Section titles: `text-sm font-semibold uppercase tracking-wider text-gray-400`.
- Page titles: `page-title` utility (`text-2xl font-black`).
- `::selection` uses `rgba(0, 180, 255, 0.28)` background (neon-blue).
- Gradient text is reserved for hero sections, brand logo, and premium module headers.

---

## 12. Button Rules

### Button Typology

| Variant | Tailwind Class / CSS Class | Background | Border | Text Color | Hover |
|---------|---------------------------|------------|--------|------------|-------|
| Primary Accent | `.btn-accent` | `linear-gradient(135deg, #ff4d00, #ff7a33)` | `rgba(255,77,0,0.35)` | `#ffffff` | -2px Y, glow intensifies |
| Glass | `.btn-glass` | `rgba(12,16,30,0.78)` + `blur(16px)` | `rgba(255,255,255,0.09)` | `var(--text-secondary)` | blue border, lighter bg |
| Default | `button` component default | `bg-primary-600` | none | `text-primary` | shadow, darker bg |
| Outline | `button` component outline | `bg-surface` | `border-border` | — | bg lightens, text brightens |
| Ghost | `button` component ghost | transparent | none | `text-text-primary` | bg lightens |
| Link | `button` component link | transparent | none | `text-primary-600` | underline |
| Destructive | `button` component destructive | `bg-red-600` | none | `text-primary` | darker red |

### Button Sizes

| Size | Tailwind | Padding | Font |
|------|----------|---------|------|
| sm | `h-9` | `px-3 py-1.5` | 12px |
| default | `h-10` | `px-4 py-2` | 14px |
| lg | `h-12` | `px-6 py-3` | 14px |
| xl | `h-14` | `px-8 py-4` | 16px |
| icon | `h-10 w-10` | — | — |

### Button Rules

- `rounded-full` for accent and glass buttons (pill shape).
- `rounded-lg` for default, outline, ghost buttons.
- All buttons: `inline-flex items-center justify-center` + `whitespace-nowrap`.
- All buttons: `active:scale-[0.97]`.
- All buttons: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`.
- Disabled: `disabled:pointer-events-none disabled:opacity-50`.
- Gradient backgrounds are ONLY for `.btn-accent`. Never use inline gradient on buttons.
- Glass buttons are for secondary/floating actions (scroll-to-top, toolbars, dismiss).

---

## 13. Input Rules

### Input Tokens

| Token | Dark | Light |
|-------|------|-------|
| `--input-bg` | `rgba(6,8,18,0.72)` | `#FFFFFF` |
| `--input-border` | `rgba(255,255,255,0.08)` | `rgba(148,163,184,0.3)` |
| `--input-focus-border` | `rgba(0,180,255,0.45)` | `#FF4D00` |
| `--input-text` | `#f0f4ff` | `#000000` |
| `--input-placeholder` | `#6b7894` | `#9CA3AF` |
| `--input-disabled-bg` | `rgba(255,255,255,0.04)` | `#F3F4F6` |

### Input Variants

**Glass Input** (`.glass-input`):
- Pill shape (`rounded-full`)
- `backdrop-filter: blur(16px)`
- Focus: blue neon border with glow ring

**Dark Input** (`.input-dark` utility):
- `rounded-xl`
- `background: rgba(255,255,255,0.04)`
- Focus: orange border (`rgba(255,77,0,0.4)`)
- Placeholder: `rgba(255,255,255,0.35)`

**Tailwind-Only Input** (standard pattern):
- `rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#FF4D00]/40`

### Input Rules

- Every input MUST have: `outline-none`, `transition` (border-color 0.2s), `placeholder` styling.
- Every input MUST have a visible focus state with a border color change.
- Search inputs are pill-shaped (`rounded-full`).
- Form inputs are `rounded-xl` or `rounded-lg`.
- `border-border` / `--border-color` is the default non-focused state.
- Disabled inputs: `opacity-50`, `cursor-not-allowed`, `--input-disabled-bg`.

---

## 14. Card Rules

### Card Anatomy

Every card in TRADINGO follows this structure:

```
┌─────────────────────────────────┐
│  (neon-rainbow-border)          │
│  (ambient-backlight)            │
│  ┌───────────────────────────┐  │
│  │  Icon / Image             │  │
│  │  Title                    │  │
│  │  Description / Meta       │  │
│  │  Badges / Status          │  │
│  │  Action (optional)        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Card Selection by Context

| Context | Card Pattern | border-radius |
|---------|-------------|---------------|
| Dashboard stat | `.glass-card` + `.neon-rainbow-border` + `.ambient-backlight` | `rounded-2xl` |
| Product discovery | `.compact-stack-card` + `.neon-rainbow-border` + `.ambient-backlight` | `rounded-2xl` |
| Company profile | `.compact-stack-card` + `.neon-rainbow-border` + `.ambient-backlight` | `rounded-2xl` |
| Professional card | `.compact-stack-card` + `.neon-rainbow-border` + `.ambient-backlight` | `rounded-3xl` |
| Feature/benefit | `.glass-card` + `.glow-surface` | `rounded-2xl` |
| Content panel | `.glass-card` | `rounded-xl` |
| Modal content | `.glass-card-elevated` | `rounded-2xl` |
| Settings section | `.glass-card-subtle` | `rounded-xl` |
| Enterprise page | `.card-premium` | `rounded-[22px]` |
| Ecosystem/badges | `.glass-card-neon` | `rounded-2xl` |

### Card Hover Rules

- All interactive cards lift on hover (`-translateY-1` to `-translateY-2`).
- All interactive cards brighten border on hover.
- Cards using neon-rainbow-border: opacity increases from 0.3 to 1.0 on hover.
- Compact-stack-card: stacked `::before`/`::after` shadow layers spread outward.
- Non-interactive cards (settings, content panels): no hover effect, no cursor change.

---

## 15. Table Rules

### Table Dark Utility (`.table-dark`)

Standardized dark table with:

| Element | Style |
|---------|-------|
| `th` | `text-xs font-semibold uppercase tracking-wider text-white/40` |
| `td` | `text-sm text-white/70` |
| Row hover | `background: rgba(255,255,255,0.02)` |
| Cell padding | `0.75rem 1rem` |
| Bottom border | `1px solid rgba(255,255,255,0.04–0.06)` |

### Inline Table Pattern (Standard)

```
rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl
  ├── thead: th="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
  └── tbody: td="px-4 py-3 text-sm text-gray-300"
       └── tr:hover: bg-white/[0.02]
```

### Table Rules

- Every table wraps in a glass container (`rounded-xl border backdrop-blur-xl`).
- Table headers: uppercase, 12px, semibold, gray-400 (dark) / gray-500 (light).
- Table cells: 13–14px, secondary text color.
- `border-separate border-spacing-0` for clean cell borders.
- Responsive: use `hidden sm:table-cell` / `hidden md:table-cell` for column visibility.
- Pagination: top-right or bottom-right, using `chevron-left/chevron-right` buttons.
- No horizontal scroll without sticky first column.

---

## 16. Dashboard Rules

### Dashboard Anatomy

A standard dashboard page consists of:

1. **Page Header** (`.page-header` component)
   - `rounded-3xl border bg-surface p-6 backdrop-blur-xl`
   - Title: `text-2xl font-bold sm:text-3xl`
   - Description: `text-sm text-gray-600`
   - Actions slot: inline buttons

2. **Stat Cards Row** (`.stat-card` / `StatCard` component)
   - Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
   - Each card: `.glass-card` + `.neon-rainbow-border` + `.ambient-backlight`
   - Content: icon (rounded-xl accent bg), value (text-2xl font-bold), label (text-xs uppercase), change badge (TrendingUp/Down)

3. **Content Grid** (below stats)
   - Charts row: `grid gap-6 lg:grid-cols-2`
   - Tables: full-width glass container
   - Sidebars: `lg:col-span-2` for main, `lg:col-span-1` for secondary

### Dashboard Rules

- Stat cards are ALWAYS in a responsive 4-column grid.
- Stat values: `text-2xl font-black` with `--text-primary`.
- Stat labels: `text-xs font-medium uppercase tracking-wider` with `--text-muted`.
- Change indicators use `TrendingUp` (green) or `TrendingDown` (red) Lucide icons.
- Page header includes breadcrumbs via `Breadcrumbs` component.
- Dashboard pages MUST have skeleton loading states (`.dashboard-skeleton`).

---

## 17. Modal Rules

### Modal Anatomy

```
fixed inset-0 z-50 flex items-center justify-center p-4
  └── backdrop: absolute inset-0 bg-black/60 backdrop-blur-sm
  └── content: relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl
       ├── (motion.div with scale/y animation)
       └── (close button top-right)
```

### Motion Pattern

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
/>
```

### Modal Rules

- Backdrop: `bg-black/60 backdrop-blur-sm`, click-to-dismiss.
- Content: `rounded-2xl` with border, max-w-lg (default) to max-w-2xl (large).
- Enter animation: fade in + scale 0.95→1.0 + y 20→0 (framer-motion `motion.div`).
- Exit animation: reverse of enter.
- Close button: top-right, rounded, glass-style bg.
- No scroll on body while modal is open (`overflow: hidden`).
- `AnimatePresence` for mount/unmount animation.
- Focus trap inside modal (tab cycles through modal elements).

---

## 18. Drawer Rules

### Drawer Anatomy

```
fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-surface shadow-xl
```

### Drawer Rules

- Position: `fixed right-0 top-0`, full height.
- Width: `max-w-sm` (384px) by default, up to `max-w-md` for complex forms.
- Background: `bg-surface` (glass or solid).
- Shadow: `shadow-xl`.
- Animation: slide in from right (framer-motion x: 100%→0).
- Backdrop: same as modal (`bg-black/60 backdrop-blur-sm`).
- Close button: top-right, same as modal.
- Header: sticky top-0 with title + close.
- Content: scrollable (`overflow-y-auto`).
- Used for: notifications, filters, forms, detail panels.

---

## 19. Navigation Rules

### Primary Navigation (`.premium-nav-capsule`)

The main navigation is a floating glass pill at the top of every page.

**Structure:**
- `position: fixed; top: 0.5rem;` (36px on md+)
- `left: 0; right: 0; z-index: 50`
- Container: `.glass-nav` (pointer-events: none, so clicks pass through to the capsule)
- Capsule: `.premium-nav-capsule` (multi-radial gradient, blur(32px), rounded-full)

**Nav Items:**
- Background: transparent (default), `rgba(255,77,0,0.12)` (active)
- Text: `var(--nav-text)` (default), `var(--nav-active-text)` (active)
- Border: `rgba(255,255,255,0.08)` (default), orange glow (hover)
- Hover: `.nav-capsule-rainbow` — orange glow shadow + border brightening

**Mobile Navigation:**
- Hamburger icon in the pill.
- `AnimatePresence` + framer-motion slide-down for the mobile menu.
- Full-screen or dropdown overlay.

### Secondary Navigation (Dashboard Topbar)

- `position: sticky; top: 0; z-index: 40`
- Height: `h-16`
- Background: `--header-bg` (`rgba(0,29,0,0.95)` dark / `#FFFFFF` light)
- Bottom border: `1px solid` using `--nav-border`
- Elements: logo/brand, page title, search bar, notification bell, profile dropdown, theme toggle

### Navigation Rules

- Primary nav is ALWAYS the `.premium-nav-capsule` at the top.
- Dashboard nav is ALWAYS the `Topbar` component with `Sidebar`.
- Active nav item: accent background + accent text.
- Notification bell shows unread count via `UnreadBadge` (`.bg-[#FF4D00] rounded-full h-4 min-w-[16px] text-[10px]`).
- Profile dropdown uses glass card styling with slide-down animation.

---

## 20. Sidebar Rules

### Sidebar Anatomy

```
fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r border-border
```

### States

| State | Width | Visibility |
|-------|-------|------------|
| Expanded | `w-64` | All text + icons visible |
| Collapsed | `w-16` | Only icons visible |

### Styling

| Element | Token / Class |
|---------|---------------|
| Background | `--sidebar-bg` (#050510 dark / #FFFFFF light) |
| Default text | `--sidebar-text` (#a8b4cc dark / #374151 light) |
| Active background | `--sidebar-active-bg` (rgba(255,77,0,0.10) dark / rgba(255,77,0,0.08) light) |
| Active text | `--sidebar-active-text` (#FF7A33 dark / #FF4D00 light) |
| Icon color | `--sidebar-icon` (#6b7894 dark / #94A3B8 light) |
| Badge (count) | `rounded-full bg-primary-600 px-1.5 text-[10px] font-medium` |

### Sections

- **Core** — Dashboard, Products, Orders, Quotes
- **Commerce** — Payments, Shipments, Delivery
- **Compliance** — RFQs, Negotiations, Disputes
- **Intelligence** — Analytics, CRM, Ecosystem
- **System** — Settings (admin only)

### Sidebar Rules

- Icons use `ICON_MAP` lookup (string → Lucide component).
- Collapsible via toggle button with `aria-label` for accessibility.
- `overflow-y-auto` for scrollable sections.
- Expandable sections with `ChevronDown` rotation.
- Active state is ALWAYS an accent-background + accent-text combination.
- Badges for notification counts.

---

## 21. Header / Footer Rules

### Header

| Token | Dark | Light |
|-------|------|-------|
| `--header-bg` | `rgba(0,29,0,0.95)` | `#FFFFFF` |
| `--header-text` | `#FFFFFF` | `#0F172A` |

- The header is the dashboard topbar (not the global nav).
- `position: sticky; top: 0`
- `backdrop-filter: blur(8px)` for glass effect when scrolling.
- Contains: company logo, page context title, search, actions.

### Footer

| Token | Dark | Light |
|-------|------|-------|
| `--footer-bg` | `#050510` | `#FFFFFF` |
| `--footer-text` | `#6b7894` | `#6B7280` |

- Footer is a simple text bar at the bottom of public pages.
- Links: secondary text color, hover accent.
- Social icons: inline SVG (Facebook, Twitter, LinkedIn, Telegram, YouTube).
- Copyright: `text-xs text-muted`.

---

## 22. Status Chips

### StatusBadge Component

`StatusBadge` is the single, canonical status chip for the entire platform. It normalizes any status string via `normalizeStatus()` and renders the appropriate color.

### Status → Color Mapping

| Status Group | Border | Background | Text Color |
|-------------|--------|------------|------------|
| active, approved, delivered, completed, paid, confirmed | `rgba(74,222,128,0.25)` | `rgba(74,222,128,0.12)` | `#4ade80` |
| pending, processing, in-transit, partial | `rgba(255,77,0,0.40)` | `rgba(255,77,0,0.10)` | `#FF4D00` |
| cancelled, rejected, failed, refunded, disputed | `rgba(239,68,68,0.40)` | `rgba(239,68,68,0.10)` | `#ef4444` |
| draft, scheduled, on-hold | `rgba(250,204,21,0.25)` | `rgba(250,204,21,0.12)` | `#facc15` |
| info, shipped, fulfilled, verified | `rgba(59,130,246,0.25)` | `rgba(59,130,246,0.12)` | `#60a5fa` |

### CSS Badge Utilities

| Utility | Color |
|---------|-------|
| `.badge-orange` | Orange (accent) |
| `.badge-green` | Green (success) |
| `.badge-red` | Red (error) |
| `.badge-blue` | Blue (info) |
| `.badge-yellow` | Yellow (warning) |

### Badge Component

`Badge` component variants: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`.
Base class: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`.

### VerifiedBadge Component

Types: `verified`, `trusted`, `premium`, `gold`, `platinum`, `elite`, `top-seller`, `top-buyer`, `fast-responder`, `reliable-supplier`.
Sizes: `sm` (h-3.5), `md` (h-4), `lg` (h-5).
Style: `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium`.

### Status Chip Rules

- `StatusBadge` is the ONLY status chip component — never create inline status divs.
- Normalize all status strings through `normalizeStatus()` before rendering.
- Use `Badge` component for non-status labels (plan tier, category, type).
- Use `VerifiedBadge` for trust/verification indicators.
- Status colors are semantic, not decorative.

---

## 23. Badges

### Badge Types

| Badge | Component | Purpose |
|-------|-----------|---------|
| StatusBadge | `components/dashboard/status-badge.tsx` | Entity status |
| Badge | `components/ui/badge.tsx` | Generic labels |
| VerifiedBadge | `components/shared/VerifiedBadge.tsx` | Trust/verification |
| BestScoreBadge | `components/discovery/` | Supplier score (near-me) |
| UnreadBadge | inline in Topbar | Notification count |
| SidebarBadge | inline in Sidebar | Nav item count |
| PlanBadge | inline in tradeserv cards | Plan tier indicator |

### Badge Rules

- All badges are `rounded-full`.
- All badges use `text-[10px]` or `text-xs`.
- All badges have a colored border + matching background at low opacity + matching text.
- Unread/notification badges use `#FF4D00` background with white text.

---

## 24. Empty States

### EmptyState Component

```
flex flex-col items-center justify-center py-16 text-center
  → Icon: h-16 w-16 rounded-2xl bg-surface
  → Title: text-lg font-semibold text-gray-800
  → Description: text-sm text-gray-500 (max-w-sm)
  → Action slot: optional CTA button
```

### NotFoundState Component

```
flex min-h-[60vh] items-center justify-center p-4
  → Card: max-w-md text-center
  → Icon: rounded-full bg-[#FF4D00]/10
  → Actions: Home, Dashboard, Search links
```

### ErrorState Component

```
flex min-h-[60vh] items-center justify-center p-4
  → Card: max-w-md text-center
  → Icon: rounded-full bg-red-100 with AlertTriangle
  → Error ID: font-mono text-xs
  → Actions: Retry, Go Home, Dashboard
```

### Inline Empty State (Admin/Management)

```
flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] p-12 backdrop-blur-xl
```

### Empty State Rules

- ALL data-driven pages MUST handle loading, empty, and error states.
- Empty state: `py-16` centered content, icon (48-64px), title, description, optional CTA.
- Error state: include error ID in `font-mono` for debugging.
- Never render "No data" naked text without an icon and container.
- Use `EmptyState` component whenever possible. Inline only for admin/management pages.

---

## 25. Skeleton Loaders

### Skeleton Component

`components/ui/skeleton.tsx`:
- Base: `rounded-md bg-surface-tertiary`
- Shimmer: `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent`

### Shimmer Pattern

The shimmer string is the standard loading indicator:
```
relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent
```

### Skeleton Variants

| Skeleton | Location | Mimics |
|----------|----------|--------|
| `DashboardSkeleton` | `components/dashboard/skeleton.tsx` | Full dashboard page (4 stats + 2 charts + 1 table) |
| `StatCardSkeleton` | `components/dashboard/skeleton.tsx` | Single stat card |
| `TableSkeleton` | `components/dashboard/skeleton.tsx` | Table rows |
| `ProductSkeleton` | `components/product/` | Product detail page |
| `SearchSkeleton` | `components/tradeserv/` | Search results |
| `CompanyCardSkeleton` | `components/company/` | Company card |
| `AnimatedContent` | `components/ui/animated-content.tsx` | Framer Motion wrapper (skeleton ↔ content) |

### Skeleton Rules

- ALL loading states MUST use skeleton placeholders, not spinners (except for buttons/mutations).
- Skeletons MUST match the layout shape of the content they replace.
- Skeleton height should approximate the content height.
- Use `AnimatedContent` for smooth skeleton→content transitions.
- Shimmer animation runs at 1.5s infinite, diagonal from left to right.

---

## 26. Charts

### Chart Philosophy

TRADINGO does NOT use any chart library (Recharts, Chart.js, D3). All visualizations are built with **pure CSS + Tailwind**.

### Chart Patterns

| Visualization | Implementation |
|--------------|----------------|
| Progress bars | `h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400` |
| XP bar | `h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary` with colored fill |
| Bar chart (admin) | Colored `div` heights with `bg-gradient-to-t` |
| Distribution bars | `h-full rounded-full bg-gradient-to-r` with color from palette |
| Leaderboard podium | `w-16 rounded-t-lg bg-gradient-to-t` with `h-[value]` |
| Achievement rings | `rounded-full border-2` with percentage-based conic gradient |
| Donut (future) | CSS `conic-gradient()` |

### Chart Colors

Color distribution for all charts (rotated through):
```
#FF4D00 (orange), #00B4FF (blue), #A855F7 (purple),
#06FFC8 (cyan), #F72585 (pink), #FFAA00 (amber),
#22C55E (green), #3B82F6 (indigo)
```

### Chart Rules

- No external chart library. All charts are CSS-based.
- Bar heights are set via inline `style={{ height: \`${value}%\` }}`.
- Progress fills use `bg-gradient-to-r from-orange-500 to-orange-400`.
- Chart labels: `text-xs text-text-secondary`.
- Empty chart states: show a ghost bar or `—` text.

---

## 27. Icon Style

### Icon Library

- **Primary**: Lucide React (`lucide-react`).
- **Secondary**: Inline SVG for social icons (Facebook, Twitter, LinkedIn, Telegram, YouTube) and custom logos.

### Icon Conventions

| Pattern | Example |
|---------|---------|
| Loading/processing | `Loader2` with `animate-spin` |
| Navigation | `ChevronRight`, `ChevronLeft`, `ChevronDown` |
| Actions | `ArrowRight`, `X`, `Search`, `Bell` |
| Status | `Check`, `X`, `AlertTriangle`, `Info` |
| AI | `Sparkles` |
| Analytics | `BarChart3`, `TrendingUp`, `TrendingDown` |
| Finance | `CreditCard`, `DollarSign`, `Wallet` |
| Trust | `Shield`, `BadgeCheck`, `Award`, `Star` |
| Communication | `MessageSquare`, `Mail`, `Phone` |
| Location | `MapPin`, `Globe` |
| Time | `Clock`, `Calendar` |

### Icon Rules

- All icons use `lucide-react`. No other icon library.
- Decorative icons: `aria-hidden="true"`.
- Interactive icons: `aria-label` with description.
- Icon size: `h-4 w-4` (standard), `h-5 w-5` (large), `h-3 w-3` (small).
- Sidebar icon map: centralized in `ICON_MAP` in `sidebar.tsx`.
- Custom SVGs: only for social icons and brand logos. Must be inline, not external files.

---

## 28. Responsive Rules

### Breakpoint Reference

| Breakpoint | Min Width | Purpose |
|------------|-----------|---------|
| `sm:` | 640px | Tablet portrait, show/hide elements, 2-col grids |
| `md:` | 768px | Tablet landscape, table columns, nav changes |
| `lg:` | 1024px | Desktop, 3-4 col grids, sidebar visible |
| `xl:` | 1280px | Wide desktop, container padding |

### Grid Breakpoints

| Columns | Classes |
|---------|---------|
| 1 → 2 | `grid-cols-1 sm:grid-cols-2` |
| 1 → 2 → 3 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| 1 → 2 → 4 | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| 2 → 3 → 4 | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |

### Responsive Show/Hide

| Pattern | Effect |
|---------|--------|
| `hidden sm:flex` | Hide on mobile, flex on tablet+ |
| `hidden lg:flex` | Hide on mobile/tablet, flex on desktop |
| `block sm:hidden` | Show on mobile only |
| `hidden sm:table-cell` | Table column visible from tablet+ |
| `hidden md:table-cell` | Table column visible from desktop+ |

### Text Responsiveness

| Pattern | Effect |
|---------|--------|
| `text-xs sm:text-sm` | Scale up label on tablet |
| `text-sm sm:text-base` | Scale up body on tablet |
| `text-3xl sm:text-4xl lg:text-5xl` | Responsive hero heading |

### Layout Responsiveness

- Dashboard: single column on mobile, multi-column expanding at sm/lg.
- Tables: horizontal scroll on mobile, full width on desktop.
- Sidebar: `w-16` (icons only) on mobile/tablet, `w-64` on desktop.
- Forms: full width on mobile, `max-w-md` + centered on desktop.
- Cards: `grid-cols-1` (mobile) → `grid-cols-2` (sm) → `grid-cols-3/4` (lg).

---

## 29. Accessibility Rules

### Color Contrast

| Token | Dark BG Contrast | Light BG Contrast |
|-------|-----------------|-------------------|
| `--text-primary` | 15.0+:1 (#f0f4ff on #00001c) | 15.0+:1 (#000000 on #DBF1FD) |
| `--text-secondary` | 8.0+:1 (#a8b4cc on #00001c) | 7.5+:1 (#374151 on #DBF1FD) |
| `--text-tertiary` | 4.5+:1 (#6b7894 on #00001c) | 4.5+:1 (#6B7280 on #DBF1FD) |
| `--text-on-accent` | 3.0+:1 (#ffffff on #ff4d00) | 3.0+:1 (#ffffff on #ff4d00) |

### ARIA Attributes

| Element | Attribute |
|---------|-----------|
| Breadcrumb nav | `aria-label="Breadcrumb"` |
| Pagination buttons | `aria-label="Previous page"` / `aria-label="Next page"` |
| Notification bell | `aria-label="Notifications ({count} unread)"` |
| Sidebar toggle | `aria-label="Expand sidebar"` / `aria-label="Collapse sidebar"` |
| Theme toggle | `aria-label="Dark Mode"` / `aria-label="Light Mode"` |
| Decorative icons | `aria-hidden="true"` |
| Interactive icons | `aria-label` with description |
| Toast notifications | `role="status"` |
| OTP inputs | `aria-label="OTP digit {n}"` |
| Scroll to top | `aria-label="Scroll to top"` |

### Focus Indicators

| Element | Focus Style |
|---------|-------------|
| Buttons | `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` |
| Inputs | `focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1` |
| Nav items | `focus-visible:ring-2 focus-visible:ring-[#FF8A00]` |
| Glass input | `box-shadow: 0 0 0 3px rgba(0,180,255,0.08)` |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:      0.01ms !important;
    animation-iteration-count: 1   !important;
    transition-duration:     0.01ms !important;
    scroll-behavior:         auto  !important;
  }
  html { scroll-behavior: auto; }
}
```

### Accessibility Rules

- Every interactive element MUST have a visible focus indicator.
- Every icon button MUST have `aria-label`.
- Decorative icons MUST have `aria-hidden="true"`.
- Color is NEVER the sole indicator of meaning (use text + icon + color).
- All animations respect `prefers-reduced-motion`.
- Form inputs MUST have associated `<label>` or `aria-label`.
- Images MUST have `alt` text (empty `alt=""` for decorative).
- Skip-to-content link recommended for future implementation.

---

## 30. Animation Duration Standards

### Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| Fast | 0.15s | Active state, scale press |
| Quick | 0.22s | Button hover, input focus, micro-interactions |
| Standard | 0.30s | Card hover, border transitions, color changes |
| Slow | 0.40s | Neon border reveal, overlay fade |
| Entry | 0.60s | Page entry, section slide-up |
| Ambient | 3–18s | Ambient animations (pulse, spin, sweep) |

### Transition Property Rules

| Pattern | Properties |
|---------|------------|
| `transition-all duration-300` | Only for simple components (buttons, cards) |
| `transition-transform duration-300` | For translate/scale only |
| `transition-colors duration-200` | For text/border color changes |
| `transition-opacity duration-300` | For overlay reveals |
| `transition-shadow duration-300` | For shadow-only changes |

### Easing Curves

| Curve | Usage |
|-------|-------|
| `cubic-bezier(0.22, 0.61, 0.36, 1)` | Card hover, standard elevation (in-out ease) |
| `cubic-bezier(0.25, 0.8, 0.25, 1)` | Feature box, glow card |
| `cubic-bezier(0.2, 0.8, 0.2, 1)` | Compact stack card (spreading layers) |
| `ease-out` | Entry animations (fadeIn, slideUp) |
| `ease-in-out infinite` | Ambient/loop animations |
| `linear infinite` | Spin/rotation animations |

### Animation Duration Rules

- Micro-interactions (hover, focus, press): 0.15–0.22s.
- Card/component transitions (hover lift): 0.28–0.32s.
- Entry/page animations: 0.4–0.6s.
- Ambient/loop animations: 3–18s (never faster, never distracting).
- Staggered entry: 0.1s delay between each child (max 3 children).
- Respect `prefers-reduced-motion` for ALL animations.

---

## 31. Future Component Rules

### Component Design Standards

Every new component MUST follow these frozen rules:

1. **Token-first**: All colors from `--color-*` CSS variables via `@theme` mapping. Zero hardcoded hex/rgba values.

2. **Glass base**: Cards use `.glass-card` (or variant). Tables use `.table-dark` pattern. Inputs use `.glass-input` or `.input-dark`.

3. **Hover response**: Every clickable element lifts (`-translateY-1` minimum). Border brightens. Shadow deepens.

4. **Status consistency**: Use `StatusBadge` for entity states. Use `Badge` for labels. Use `VerifiedBadge` for trust indicators.

5. **Loading states**: Every data-fetching component uses skeleton matching its layout. Use `AnimatedContent` for skeleton→content transitions.

6. **Empty states**: Every list/grid/data component has an `EmptyState` for zero-data. Every error uses `ErrorState` with a unique error ID.

7. **Responsive baseline**: Mobile-first. Hidden sidebar icons at <lg. 1-col grids at default. Tables with hidden columns at sm/md.

8. **Accessibility baseline**: Focus indicators on every interactive element. `aria-label` on icon buttons. `aria-hidden` on decorative icons.

9. **Animation rules**: `transition-all duration-300` is the default. 0.22s for buttons. 0.32s for cards. Respect reduced motion.

10. **No chart libraries**: All charts are CSS-based (bar heights, progress fills, conic gradients).

### Migration Path for Phase T-3

When migrating components from hardcoded colors to the token system:

1. Replace inline color strings with `var(--color-*)` Tailwind utilities.
2. Replace `rounded-*` with the standard radius for that component type.
3. Add `.neon-rainbow-border` when the component represents a premium/high-value surface.
4. Add `.ambient-backlight` for discovery/dashboard cards.
5. Add `focus-visible:*` for keyboard accessibility.
6. Add skeleton variants if the component fetches data.
7. Verify both DESIGN_D and DESIGN_W render correctly.
8. Remove dead `dark:` variants (they are overridden by the `.dark` → CSS var system).

### What Must Never Change

- Brand accent: `#FF4D00` (and its R/G/B components `255, 77, 0`).
- Glass blur scale: 16px / 24px / 32px / 40px with matching saturate.
- Shadow direction: always below (positive Y offset).
- Font stack: Inter (body) + Playfair Display (headings). No additions.
- Radius scale: sm (4px) → md (6px) → lg (8px) → xl (12px) → 2xl (16px) → 3xl (24px) → full (9999px).
- Prismatic gradient: 6-stop sequence (blue → purple → pink → amber → cyan → blue).
- Animation timing: 0.22s (micro), 0.30s (standard), 0.60s (entry).
- Lucide as the only icon library.
- No chart library — pure CSS visualizations only.

---

## Appendix A: CSS Variable Inventory

### Global Tokens (104 total in DESIGN_D)

| Group | Count | Variables |
|-------|-------|-----------|
| Background | 4 | `--bg-base`, `--bg-elevated`, `--bg-elevated-2`, `--bg-overlay` |
| Accent | 8 | `--accent`, `--accent-rgb`, `--accent-dark`, `--accent-light`, `--accent-08/15/25/40` |
| Surface | 3 | `--surface-solid`, `--surface-solid-secondary`, `--surface-solid-tertiary` |
| Card | 6 | `--card-bg`, `--card-bg-hover`, `--card-border`, `--card-border-hover`, `--card-shadow`, `--card-shadow-hover` |
| Border | 2 | `--border-color`, `--border-light` |
| Text | 5 | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-on-accent` |
| Glass | 8 | `--glass-bg`, `--glass-bg-hover`, `--glass-border`, `--glass-border-hover`, `--glass-shadow`, `--glass-shadow-hover` |
| Neon RGB | 7 | `--neon-{color}-rgb` |
| Backlight | 7 | `--backlight-{color}` |
| Status | 4 | `--status-success`, `--status-warning`, `--status-error`, `--status-info` |
| Shadow | 4 | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` |
| Divider | 1 | `--divider-color` |
| Hover/Focus | 4 | `--hover-brightness`, `--hover-translate-y`, `--focus-ring-color`, `--focus-ring-width` |
| Navigation | 6 | `--nav-bg`, `--nav-text`, `--nav-text-muted`, `--nav-active-bg`, `--nav-active-text`, `--nav-border` |
| Sidebar | 5 | `--sidebar-bg`, `--sidebar-text`, `--sidebar-active-bg`, `--sidebar-active-text`, `--sidebar-icon` |
| Header/Footer | 4 | `--header-bg`, `--header-text`, `--footer-bg`, `--footer-text` |
| Input | 6 | `--input-bg`, `--input-border`, `--input-focus-border`, `--input-text`, `--input-placeholder`, `--input-disabled-bg` |
| Button | 7 | `--btn-primary-bg`, `--btn-primary-text`, `--btn-primary-hover-bg`, `--btn-glass-bg`, `--btn-glass-text`, `--btn-glass-hover-bg`, `--btn-glass-hover-text` |
| Gradient | 2 | `--gradient-accent`, `--gradient-glass` |
| Gray Scale | 10 | `--gray-50` through `--gray-950` |

### @theme Mapping (68 entries)

All `--color-*` entries in `@theme` reference CSS variables via `var()`, ensuring Tailwind utilities `bg-*`, `text-*`, `border-*` respond to the active theme immediately.

## Appendix B: Keyframe Registry

| Keyframe | Property Animated | Duration | Loop |
|----------|------------------|----------|------|
| `fadeIn` | opacity | 0.6s | once |
| `slideUp` | opacity, transform | 0.6s | once |
| `slideDown` | opacity, transform | 0.4s | once |
| `pulse-soft` | opacity | 3s | infinite |
| `prismSpin` | background-position | 5–6s | infinite |
| `rainbowSpin` | rotate | varies | infinite |
| `prismEdgeSlide` | background-position | 4s | infinite |
| `prismTextShift` | background-position | 5s | infinite |
| `backlightPulse` | opacity | 3.6–5s | infinite |
| `navGlassShine` | transform | 9s | infinite |
| `navActivePulse` | box-shadow | 2.8s | infinite |
| `navUnderlineShimmer` | background-position | 3s | infinite |
| `lightSweep` | transform | 8s | infinite |
| `shimmer` | transform | 1.5s | infinite |
| `globeRotate` | transform | 18s | infinite |
| `countUp` | opacity, transform | varies | once |

---

*This document freezes the TRADINGO Enterprise Design Language v1.0. All future UI development MUST conform to these rules. No deviations without Founder approval.*
