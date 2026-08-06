# TRADINGO Token Standard v1.0

> **Part of TRADINGO Design System v1.0** — FROZEN

---

## CSS Variables

All CSS custom properties are defined in `apps/web/app/globals.css` under `:root`.

### Accent

| Variable | Value | Description |
|----------|-------|-------------|
| `--accent` | `#FF4D00` | Primary brand color |
| `--accent-light` | `#FF7A33` | Lighter accent (hover, secondary) |
| `--accent-dark` | `#E04400` | Darker accent (pressed, active) |

### Surface

| Variable | Value | Description |
|----------|-------|-------------|
| `--surface` | `#0B0D18` | Primary page background |
| `--surface-secondary` | `#0F1221` | Card/section background |
| `--surface-tertiary` | `#151929` | Nested card background |

### Text

| Variable | Value | Description |
|----------|-------|-------------|
| `--text-primary` | `#F8FAFC` | Primary text color |
| `--text-secondary` | `#CBD5E1` | Secondary text |
| `--text-tertiary` | `#64748B` | Muted/disabled text |

### Border

| Variable | Value | Description |
|----------|-------|-------------|
| `--border` | `rgba(255,255,255,0.08)` | Default border color |
| `--border-hover` | `rgba(255,255,255,0.15)` | Hover border |
| `--input-focus-border` | `#FF4D00` | Input focus border |

### Nav

| Variable | Value | Description |
|----------|-------|-------------|
| `--nav-bg` | `rgba(11,13,24,0.85)` | Navigation background |
| `--nav-border` | `rgba(255,255,255,0.08)` | Navigation border |
| `--nav-active-text` | `#FF4D00` | Active nav item text |
| `--sidebar-active-text` | `#FF4D00` | Active sidebar item text |

---

## Tailwind Utilities

The `@theme` directive in `globals.css` maps CSS variables to Tailwind utility classes.

### Color Utilities

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
}
```

These generate classes: `text-accent-500`, `bg-accent-500/10`, `border-accent-500/20`, `hover:text-accent-500`, `from-accent-500`, etc.

### Background Surface Utilities

```css
@theme {
  --color-surface:        #0B0D18;
  --color-surface-secondary: #0F1221;
  --color-surface-tertiary:  #151929;
}
```

These generate: `bg-surface`, `bg-surface-secondary`, `bg-surface-tertiary`.

### Glass Utility

Defined as a `@utility`:

```css
@utility glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

Usage: `className="glass"`

---

## Theme Tokens

### Light Overrides

The `.light` class (also applied via `prefers-color-scheme: light`) overrides:

```css
.light {
  --surface: #F8FAFC;
  --surface-secondary: #FFFFFF;
  --surface-tertiary: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  --border: rgba(0, 0, 0, 0.08);
  --input-focus-border: #FF4D00;
  --nav-bg: rgba(255, 255, 255, 0.85);
  --nav-border: rgba(0, 0, 0, 0.08);
}
```

---

## Runtime Variables

Certain components use `var(--accent)` at runtime for dynamic inline styles. These are the only acceptable CSS variable usages outside Tailwind classes:

### Dynamic Color Patterns

```tsx
// Conditional inline styles (ternary-based active states)
style={{ color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.6)' }}

// Gradients
style={{ background: 'linear-gradient(135deg, var(--accent), #00CCCC)' }}

// Range input accent
style={{ accentColor: 'var(--accent)' }}
```

### Exempted Pattern

The following runtime configuration files retain direct `#FF4D00` hex values as they are brand palette definitions, not UI tokens:

| File | Occurrences | Reason |
|------|-------------|--------|
| `tailwind.config.ts` | 1 | Canonical accent DEFAULT definition |
| `app/globals.css` | 4 | CSS variable definitions |
| `components/discovery/EngineBar.tsx` | 2 | Engine config color definitions |
| `app/tradhexa/page.tsx` | 1 | ACCENTS brand palette |
| `components/sections/TradhexaEngines.tsx` | 2 | ACCENTS map + stats data array |
| `components/discovery/UnifiedCard.tsx` | 4 | GEO_COLORS brand palette |
| `components/company/CompanyCard.tsx` | 2 | Brand color array |
| `components/product/badges-bar.tsx` | 2 | Badge style config |
| `components/dashboard/status-badge.tsx` | 10 | Status color class map |
| `components/ecosystem/level-card.tsx` | 1 | Prop default fallback |
| `components/ecosystem/leaderboard-podium.tsx` | 2 | Rank config palette |
| `components/ecosystem/reward-statistics.tsx` | 2 | Stats data array |
| `components/ecosystem/membership-benefits-card.tsx` | 2 | PLAN_COLORS palette |
| `components/marketplace/supplier-score-breakdown.tsx` | 2 | GRADE_COLORS palette |
| `components/marketplace/best-score-badge.tsx` | 1 | COLORS brand palette |
| `app/admin/settings/page.tsx` | 2 | Config data array |
| `app/(auth)/login/LoginClient.tsx` | 2 | Role config palette data |

**Total exempt: 30 occurrences across 15 files.**

---

## Naming Rules

### CSS Variable Naming

- Use `--{group}-{property}` format: `--surface-secondary`, `--text-primary`, `--accent-light`
- Groups: `accent`, `surface`, `text`, `border`, `nav`, `sidebar`
- Properties: `primary`, `secondary`, `tertiary`, `light`, `dark`, `bg`, `hover`, `active`

### Tailwind Token Naming

- Scale colors: `{color}-{weight}` where weight is 50–950 (even hundreds for standard, 50/950 for extremes)
- Semantic colors: `{semantic}-{variant}` like `surface-secondary`
- Status colors: Standard Tailwind colors (`green-500`, `red-400`, `amber-500`, `blue-500`)

### Custom Utility Naming

- Use simple, descriptive lowercase names: `glass`, `scrollbar-hide`
- No vendor prefixes
- One utility per `@utility` block

---

## Semantic Rules

1. **Accent always means brand action.** `accent-500` is the only brand color. Never use it for neutral, error, or success states.
2. **Primary always means structural.** `primary-500` is neutral/slate. Never use it for brand-highlight elements.
3. **Surface always means background.** `surface`, `surface-secondary`, `surface-tertiary` form a 3-level depth hierarchy.
4. **Text follows hierarchy.** `text-primary` > `text-secondary` > `text-tertiary` in decreasing importance.
5. **Opacity for emphasis.** Use opacity variants (`/10`, `/20`, `/40`, `/80`) rather than different hue weights for different emphasis levels.

---

## Migration Rules

### For New Code

1. All brand-affirmative UI uses `accent-500` (or `accent-400`/`accent-600` variants).
2. All backgrounds use `bg-surface` / `bg-surface-secondary` / `bg-surface-tertiary`.
3. All borders use `border-border`.
4. No hardcoded hex color values in JSX.
5. No arbitrary Tailwind class values (`text-[#XXXXXX]`).

### For Existing Code

1. Prefer editing to rewriting — change the class, not the component.
2. When you see `text-[#FF4D00]`, replace with `text-accent-500`.
3. When you see `bg-white` on dark surfaces, replace with `bg-surface-secondary`.
4. When you see inline `style={{ color: '#FF4D00' }}`, replace with className or `var(--accent)`.
5. When you see `primary-*` used as a brand accent, replace with `accent-*`.

### Verification

After any migration work, verify with:

```bash
cd apps/web
npx tsc --noEmit -p tsconfig.json  # Must be 0 errors
npx next build                       # Must be 0 errors
```
