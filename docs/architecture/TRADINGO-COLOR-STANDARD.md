# TRADINGO Color Standard v1.0

> **Part of TRADINGO Design System v1.0** — FROZEN

---

## Token Groups

### Background Tokens

| Token | Value (Dark) | Value (Light) | Usage |
|-------|-------------|---------------|-------|
| `bg-surface` | `#0B0D18` | `#F8FAFC` | Primary page background |
| `bg-surface-secondary` | `#0F1221` | `#FFFFFF` | Card/container backgrounds |
| `bg-surface-tertiary` | `#151929` | `#F1F5F9` | Nested card backgrounds |
| `bg-body` | `#DBF1FD` | `#DBF1FD` | Static light-blue body (public pages) |

**Rule:** Use `bg-surface` for page-level containers. Use `bg-surface-secondary` for cards and sections. Never use `bg-white` or `bg-black` directly.

### Surface Tokens

| Token | Class | Dark Value |
|-------|-------|------------|
| Surface | `bg-surface` | `#0B0D18` |
| Surface Secondary | `bg-surface-secondary` | `#0F1221` |
| Surface Tertiary | `bg-surface-tertiary` | `#151929` |
| Surface Hover | `hover:bg-white/[0.04]` | `rgba(255,255,255,0.04)` |
| Surface Active | `bg-white/[0.08]` | `rgba(255,255,255,0.08)` |

**Rule:** Surface tokens form a 3-level hierarchy. Level 1 = page background, Level 2 = card/chrome, Level 3 = nested/inset surfaces.

### Text Tokens

| Token | Class | Value (Dark) | Usage |
|-------|-------|-------------|-------|
| Text Primary | `text-text-primary` or `text-gray-50` | `#F8FAFC` | Primary body text, headings |
| Text Secondary | `text-text-secondary` or `text-gray-300` | `#CBD5E1` | Secondary info, descriptions |
| Text Tertiary | `text-text-tertiary` or `text-gray-500` | `#64748B` | Placeholders, disabled text, metadata |
| Text Inverse | `text-gray-900` or `text-black` | `#0F172A` | Text on accent backgrounds |
| Text On Surface | `text-gray-700` | `#334155` | Text on light surfaces |

**Rule:** Never use `text-white` on `bg-surface` (dark mode) — the contrast is too harsh. Use `text-gray-50` or `text-text-primary` instead.

### Border Tokens

| Token | Class | Value |
|-------|-------|-------|
| Border Default | `border-border` | `rgba(255,255,255,0.08)` |
| Border Hover | `hover:border-white/[0.15]` | `rgba(255,255,255,0.15)` |
| Border Active | `border-accent-500/40` | `rgba(255,77,0,0.4)` |
| Border Light | `border-white/[0.06]` | `rgba(255,255,255,0.06)` |

**Rule:** Default borders are very subtle (8% opacity). Active/focused borders use the accent token.

---

## Accent Tokens

The accent scale (`#FF4D00` orange) is the single brand-affirmative color for all interactive and highlight elements.

### Numbered Palette

| Token | Value | Usage |
|-------|-------|-------|
| `accent-50` | `#FFF3ED` | Very light accent backgrounds |
| `accent-100` | `#FFE6D4` | Light accent backgrounds |
| `accent-200` | `#FFCCA8` | Hover backgrounds |
| `accent-300` | `#FFB37D` | Muted accent borders |
| `accent-400` | `var(--accent-light)` / `#FF7A33` | Secondary accent text |
| **`accent-500`** | **`var(--accent)` / `#FF4D00`** | **Primary brand color** |
| `accent-600` | `var(--accent-dark)` / `#E04400` | Hover on accent surfaces |
| `accent-700` | `#C93B00` | Pressed state |
| `accent-800` | `#A32F00` | Dark accent backgrounds |
| `accent-900` | `#7A2300` | Deep accent |
| `accent-950` | `#4D1500` | Extreme accent |

### Allowed Usage

✅ **Do use `accent-500` for:**
- Primary CTA buttons (`bg-accent-500 text-black`)
- Active/selected tab indicators
- Link text and link hover states
- Icon colors for primary actions
- Badge backgrounds for high-priority status
- Progress bar fill
- Focus ring outline (`ring-accent-500`)
- Star rating fills
- Price highlights
- "New" / "Top" / "Best" indicators
- Gradient origins (`from-accent-500`)

✅ **Do use `accent-400` for:**
- Secondary accent text (subtle highlights)
- Muted accent borders

✅ **Do use `accent-50`–`accent-200` for:**
- Background tints for accent-themed sections (via opacity)

### Forbidden Usage

❌ **Never use `accent-*` for:**
- Page backgrounds (use `bg-surface`)
- Error states (use `red-500`)
- Success states (use `green-500` or `emerald-500`)
- Info states (use `blue-500`)
- Neutral borders (use `border-border`)
- Disabled elements (use `gray-500`)

❌ **Never use `primary-*` (slate scale) as a brand accent.** The primary palette is for structural/neutral UI only.

❌ **Never replace `accent-500` with a different color.** The accent token is the single brand color and must remain `#FF4D00` in all themes.

---

## Primary Numbered Palette

The `primary-*` scale is a slate/gray palette used for neutral structural UI.

| Token | Value | Token | Value |
|-------|-------|-------|-------|
| `primary-50` | `#F8FAFC` | `primary-500` | `#64748B` |
| `primary-100` | `#F1F5F9` | `primary-600` | `#475569` |
| `primary-200` | `#E2E8F0` | `primary-700` | `#334155` |
| `primary-300` | `#CBD5E1` | `primary-800` | `#1E293B` |
| `primary-400` | `#94A3B8` | `primary-900` | `#0F172A` |

**Usage:** Text colors, neutral borders, secondary backgrounds, skeleton loading states.

---

## Status Colors

| Status | Token | Usage |
|--------|-------|-------|
| Success | `green-500` / `emerald-500` | Completed, delivered, approved |
| Error | `red-500` / `red-400` | Failed, cancelled, rejected |
| Warning | `yellow-500` / `amber-500` | Pending, in-progress, warning |
| Info | `blue-500` / `blue-400` | Negotiation, messaging |
| Premium | `purple-500` / `purple-400` | Premium/Elite tier, special features |
| Neutral | `gray-500` / `primary-500` | Default, inactive, disabled |

**Rule:** Status colors must be paired with the appropriate opacity variant (e.g., `bg-green-500/10` for backgrounds, `text-green-400` for text).

---

## Button Colors

| Variant | Background | Text | Hover | Disabled |
|---------|-----------|------|-------|----------|
| Primary | `bg-accent-500` | `text-black` | `hover:bg-accent-600` | `opacity-50` |
| Secondary | `bg-white/[0.08]` | `text-white` | `hover:bg-white/[0.12]` | `opacity-50` |
| Ghost | `transparent` | `text-white/70` | `hover:bg-white/[0.06]` | `opacity-40` |
| Danger | `bg-red-500` | `text-white` | `hover:bg-red-600` | `opacity-50` |
| Outline | `transparent` | `text-accent-500` | `hover:bg-accent-500/10` | `opacity-50` |

**Rule:** Primary buttons use `accent-500` background with black text (not white) for maximum contrast. Outline buttons use `border border-accent-500/30`.

---

## Migration from Legacy Classes

| Deprecated Class | Replacement |
|-----------------|-------------|
| `bg-white` (on dark surfaces) | `bg-surface-secondary` |
| `text-white` (on `bg-surface`) | `text-text-primary` |
| `text-[#FF4D00]` | `text-accent-500` |
| `bg-[#FF4D00]` | `bg-accent-500` |
| `border-[#FF4D00]/20` | `border-accent-500/20` |
| `hover:text-[#FF4D00]` | `hover:text-accent-500` |
| `primary-*` used as accent | `accent-*` |
| `bg-surface-solid` | `bg-surface` |

---

## Final Metrics

| Category | Count |
|----------|-------|
| Color tokens (CSS vars) | 56 |
| Tailwind theme colors | 60+ |
| Files migrated from hardcoded hex | 111 |
| Category A replacements (`[#FF4D00]` → `accent-500`) | ~516 |
| Category B replacements (`style={{color}}` → var/class) | ~50 |
| Remaining `#FF4D00` (runtime config, exempt) | 30 |
| Verification (tsc + next build) | 0 errors |
