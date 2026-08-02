# Tradingo Design Color Usage Guide — Light Glassmorphism Variant

**Base Background: `#DBF1FD` (Light Sky Blue)** — *This is now the fixed website background. All other tokens adapt to it.*

---

## 1. Base Background & Surface Layers

| Layer | Color / Value | Usage |
|-------|---------------|-------|
| **Page Background** | `#DBF1FD` | `<body>` — **do not change** |
| **Section Overlay** | `rgba(255, 255, 255, 0.7)` | Section wrappers, subtle banding |
| **Deep Shadow** | `rgba(8, 11, 18, 0.12)` | Elevation for modals, dropdowns, toasts |
| **Inner Card Shadow** | `rgba(8, 11, 18, 0.08)` | Card depth on light base |

> **Rule:** No pure black (`#080b12`) as background anywhere. The dark navy only appears inside glass gradients and text.

---

## 2. Glass Card System (Adapted for Light Base)

All cards, tiles, info boxes, stats, search bar, footer blocks use a **light frosted glass**:

```css
/* Primary glass surface */
background: linear-gradient(180deg,
  rgba(255, 255, 255, 0.85),
  rgba(245, 247, 251, 0.72)
);
backdrop-filter: blur(16px) saturate(160%);
border: 1px solid rgba(255, 255, 255, 0.6);
box-shadow:
  0 4px 24px rgba(8, 11, 18, 0.06),
  inset 0 1px 0 rgba(255, 255, 255, 0.9);
```

**Variants**

| Variant | Gradient Stops | Border | Use For |
|---------|----------------|--------|---------|
| **Default** | `rgba(255,255,255,0.85)` → `rgba(245,247,251,0.72)` | `rgba(255,255,255,0.6)` | Feature cards, category boxes, lead cards |
| **Elevated** | `rgba(255,255,255,0.92)` → `rgba(245,247,251,0.8)` | `rgba(255,255,255,0.75)` | Modals, dropdowns, search dropdown |
| **Subtle** | `rgba(255,255,255,0.6)` → `rgba(245,247,251,0.45)` | `rgba(255,255,255,0.4)` | List items, table rows, footer blocks |

---

## 3. Text Colors (High Contrast on Light Base)

| Element | Color | Contrast vs `#DBF1FD` |
|---------|-------|----------------------|
| **Main Headings** | `#080b12` | 12.8:1 ✅ |
| **Secondary Headings** | `#101726` | 10.2:1 ✅ |
| **Body / Paragraph** | `#1e2a3a` | 7.1:1 ✅ |
| **Muted / Helper** | `#4a5a6f` | 4.6:1 ✅ |
| **Placeholder / Disabled** | `#7a8aa0` | 3.2:1 (use only for non-essential) |
| **Link / Accent Text** | `#1d4ed8` (Blue-700) | 5.8:1 ✅ |
| **Link Hover** | `#1e3a8a` (Blue-800) | 7.4:1 ✅ |

> **Rule:** Never use pure white text on cards. Dark navy (`#080b12`, `#101726`) provides the premium "ink on paper" feel.

---

## 4. Accent Color System (Unchanged Hues, Adjusted Usage)

| Accent | Hex | Light-Base Usage |
|--------|-----|------------------|
| **Blue** | `#3b82f6` | Primary CTA, search focus ring, active nav, primary category |
| **Green** | `#22c55e` | Success toasts, verified badges, "in stock" tags |
| **Orange** | `#f97316` | Promoted/featured badges, urgency banners |
| **Yellow** | `#facc15` | Spotlight tags, "new" indicators (use `#ca8a04` for text) |
| **Purple** | `#8b5cf6` | Premium plan badge, pro features, AI-powered labels |
| **Red** | `#ef4444` | Error states, limited-offer countdown, destructive actions |

**Accent Application Rules on Light Base:**
- Buttons: Solid accent fill + white text (`#ffffff`)
- Badges: `background: accent-10%` + `color: accent-700` + thin accent border
- Glows: `box-shadow: 0 0 0 3px accent-20%` on focus; **no colored backlight bloom** (looks muddy on light)
- Cards: **One accent per card** — accent appears only on border-top (3px) or left-bar (4px), never as card background fill

---

## 5. Interactive States

| State | Card / Button | Spec |
|-------|---------------|------|
| **Default** | Card | Light glass gradient + subtle border |
| **Hover (Card)** | Card | Border brightens to `rgba(255,255,255,0.9)`; shadow lifts to `0 8px 32px rgba(8,11,18,0.1)`; **accent top-bar glows** (opacity 1 → 1) |
| **Hover (Button)** | Primary CTA | `background: #2563eb` (Blue-600); shadow `0 4px 16px rgba(59,130,246,0.35)` |
| **Focus (All)** | Any | `outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.35)` |
| **Active/Pressed** | Button | Scale `0.98`; background `Blue-700` |
| **Disabled** | Button/Input | Opacity `0.45`; cursor `not-allowed` |

> **No dark backlight bloom on hover** — light base makes colored glows look dirty. Use elevation + border brightening instead.

---

## 6. Navbar & Top Bar

```css
.navbar {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(8, 11, 18, 0.06);
}
.nav-link { color: #1e2a3a; }
.nav-link:hover { color: #1d4ed8; }
.nav-cta {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(59,130,246,0.3);
}
.nav-cta:hover { background: #2563eb; }
```

---

## 7. Hero Section

| Element | Style |
|---------|-------|
| **Background** | `#DBF1FD` (page base) + subtle radial: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.08), transparent)` |
| **Inner Panel** | Elevated glass variant |
| **Heading** | `#080b12` |
| **Subtext** | `#4a5a6f` |
| **Primary CTA** | Blue solid (`#3b82f6`) |
| **Secondary CTA** | Ghost: `border: 1px solid #3b82f6; color: #3b82f6; background: transparent` |

---

## 8. Footer

```css
.footer {
  background: #cfe8fb;           /* slightly deeper than page base */
  border-top: 1px solid rgba(8,11,18,0.06);
}
.footer-heading { color: #080b12; }
.footer-link { color: #1e2a3a; }
.footer-link:hover { color: #1d4ed8; }
```

---

## 9. Quick Implementation Token Map (CSS Custom Properties)

```css
:root {
  /* Base */
  --bg-page: #DBF1FD;
  --bg-section: rgba(255,255,255,0.7);
  --shadow-deep: rgba(8,11,18,0.12);
  --shadow-card: rgba(8,11,18,0.08);

  /* Glass */
  --glass-default: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,247,251,0.72));
  --glass-elevated: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,247,251,0.8));
  --glass-subtle: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(245,247,251,0.45));
  --glass-border: rgba(255,255,255,0.6);
  --glass-border-strong: rgba(255,255,255,0.75);

  /* Text */
  --text-heading: #080b12;
  --text-heading-2: #101726;
  --text-body: #1e2a3a;
  --text-muted: #4a5a6f;
  --text-placeholder: #7a8aa0;
  --text-link: #1d4ed8;
  --text-link-hover: #1e3a8a;

  /* Accents */
  --accent-blue: #3b82f6;
  --accent-blue-600: #2563eb;
  --accent-blue-700: #1d4ed8;
  --accent-green: #22c55e;
  --accent-orange: #f97316;
  --accent-yellow: #facc15;
  --accent-yellow-text: #ca8a04;
  --accent-purple: #8b5cf6;
  --accent-red: #ef4444;

  /* Navbar */
  --nav-bg: rgba(255,255,255,0.78);
  --nav-border: rgba(8,11,18,0.06);
  --nav-text: #1e2a3a;
  --nav-cta-bg: #3b82f6;

  /* Footer */
  --footer-bg: #cfe8fb;
  --footer-border: rgba(8,11,18,0.06);
}
```

---

## 10. Dos & Don'ts (Light-Base Edition)

| ✅ Do | ❌ Don't |
|------|----------|
| Use dark navy text (`#080b12`) on all glass surfaces | Use white or light gray text on cards |
| Keep glass cards **translucent white** with backdrop blur | Use opaque white cards (loses glass feel) |
| One accent per element (border/bar only) | Fill card backgrounds with accent colors |
| Elevate on hover via shadow + border brightening | Add colored glow bloom behind cards |
| Primary CTA = solid blue; secondary = ghost blue | Multiple CTA styles on same screen |
| Footer slightly deeper than page base (`#cfe8fb`) | Footer same as page base (no visual separation) |

---

## 11. Component Quick Reference

| Component | Background | Border | Text | Accent Touch |
|-----------|------------|--------|------|--------------|
| **Page** | `#DBF1FD` | — | — | — |
| **Section** | `rgba(255,255,255,0.7)` | — | — | — |
| **Card (default)** | `--glass-default` | `--glass-border` | `--text-body` | 3px top bar in accent |
| **Card (elevated)** | `--glass-elevated` | `--glass-border-strong` | `--text-body` | — |
| **Button Primary** | `--accent-blue` | — | `#ffffff` | — |
| **Button Ghost** | `transparent` | `--accent-blue` | `--accent-blue` | — |
| **Navbar** | `--nav-bg` | `--nav-border` | `--nav-text` | CTA = `--nav-cta-bg` |
| **Hero Panel** | `--glass-elevated` | `--glass-border-strong` | `--text-heading` | — |
| **Footer** | `--footer-bg` | `--footer-border` | `--text-body` | Links = `--text-link` |

---

**Result:** A cohesive **light glassmorphism** system anchored on `#DBF1FD` that preserves the premium, layered depth of the original dark spec — just inverted for a bright, airy brand identity.