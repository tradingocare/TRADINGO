# TRADINGO UI/UX Design System

> **Status:** Design tokens exist in Tailwind config but are not yet documented in a formal design system file. This document captures the patterns observed in the codebase.

## Design Tokens

### Colors (Dark Theme Default)

Based on Tailwind CSS 4 defaults used across the codebase:

| Token | Value | Usage |
|-------|-------|-------|
| `bg-background` | `#0a0a0f` | Page background |
| `bg-card` | `#1a1a2e` | Card/surface backgrounds |
| `bg-card-hover` | `#232340` | Card hover state |
| `border-default` | `#334155` | Borders and dividers |
| `text-primary` | `#f1f5f9` | Primary text |
| `text-secondary` | `#94a3b8` | Secondary/muted text |
| `text-muted` | `#64748b` | Disabled/placeholder text |
| `primary` | `#6366f1` | Primary accent (indigo) |
| `primary-hover` | `#818cf8` | Primary hover |
| `secondary` | `#06b6d4` | Secondary accent (cyan) |
| `accent` | `#f59e0b` | Warning/accent (amber) |
| `success` | `#10b981` | Success states (emerald) |
| `danger` | `#ef4444` | Error/danger states (red) |
| `warning` | `#f97316` | Warning states (orange) |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 3xl (30px) | Bold |
| H2 | Inter | 2xl (24px) | Bold |
| H3 | Inter | xl (20px) | Semibold |
| Body | Inter | base (16px) | Normal |
| Small | Inter | sm (14px) | Normal |
| Caption | Inter | xs (12px) | Normal |
| Monospace | JetBrains Mono | sm | Normal |

### Spacing

Tailwind spacing scale (4px base): 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px

### Icons

- **Library**: Lucide React (v0.460+)
- **Style**: Outline, 24px default, strokeWidth 1.5-2
- **Pattern**: Import specific icons, never the full library

### Animations (Framer Motion 12)

- Page transitions: Fade + slide
- Cards: Hover scale + border glow
- Stats counters: Count-up animation
- XP Float: CSS keyframe float-up + fade-out
- Level-up: Modal overlay with glow + Sparkles
- Loading: Skeleton shimmer animation
- Toast: Slide-in from right, auto-dismiss
- Content: `AnimatedContent` component for mount animations

## Reusable UI Patterns

### Cards
```typescript
// Standard card pattern
<div className="rounded-lg border border-[#334155] bg-[#1a1a2e] p-6">
  {children}
</div>
```

### Status Badges
```typescript
// Unified via StatusBadge component
<StatusBadge status={order.status} />  // Auto-normalizes via normalizeStatus()
```

### Loading States
```typescript
// Every data-dependent component shows loading skeleton
{isLoading ? <Skeleton className="h-20 w-full" /> : <Content data={data} />}
{!isLoading && (!data || data.length === 0) && <EmptyState ... />}
{!isLoading && data && <Content data={data} />}
```

### Forms
- React Hook Form for form state
- Zod for schema validation (frontend)
- class-validator for backend DTOs
- `react-hot-toast` for success/error feedback

### Responsive Behavior
- Mobile-first with Tailwind breakpoints (`sm`, `md`, `lg`, `xl`)
- Stacked layout on mobile, grid on desktop
- Collapsible sidebar on mobile
- Sticky table headers on scroll

## Accessibility

- Semantic HTML (Next.js server components)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible ring on interactive elements
- `prefers-reduced-motion` respected for animations
- Color contrast ratios maintained
- Screen reader friendly labels
