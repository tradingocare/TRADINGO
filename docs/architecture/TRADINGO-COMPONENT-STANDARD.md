# TRADINGO Component Standard v1.0

> **Part of TRADINGO Design System v1.0** — FROZEN  
> All components live at `apps/web/components/ui/`

---

## Button

**File:** `components/ui/button.tsx`

**Purpose:** Primary interactive element for user actions.

**Variants:**
| Variant | Usage |
|---------|-------|
| `default` | Primary CTA (accent background) |
| `secondary` | Secondary action |
| `ghost` | Subtle tertiary action |
| `danger` | Destructive action |
| `outline` | Bordered action |
| `link` | Text-only link-style |

**Sizes:** `default` (h-10), `sm` (h-8), `lg` (h-12), `icon` (square, size-matched)

**Props:** `variant`, `size`, `disabled`, `loading`, `asChild`

**When to use:** Any clickable action. Use `default` for primary CTAs (max 1 per view). Use `secondary` for supporting actions. Use `ghost` for toolbar/tab actions. Use `danger` for delete/remove.

**When NOT to use:** Navigation links should use `Link` from Next.js, not `Button`. Inline text actions should use `button` elements with `variant="ghost"` or simple styling.

**Example:**
```tsx
<Button variant="primary" size="sm" loading={isSaving}>
  Save Changes
</Button>
```

---

## Card

**File:** `components/ui/card.tsx`

**Purpose:** Content container with consistent elevation and padding.

**Sub-components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

**Variants:** None (single visual style). Accepts `className` for override.

**When to use:** Grouping related content. Cards should be used for dashboards, list items, and settings panels.

**When NOT to use:** Do not nest cards more than 2 levels deep. For page-level sections, use `section` with `bg-surface-secondary`.

**Example:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Profile</CardTitle>
    <CardDescription>Manage your account details</CardDescription>
  </CardHeader>
  <CardContent>
    ...
  </CardContent>
</Card>
```

---

## Input

**File:** `components/ui/input.tsx`

**Purpose:** Text input field for forms.

**Props:** All standard HTMLInputElement props + `error` (boolean), `icon` (ReactNode for prefix icon).

**When to use:** All text, number, email, password, and search inputs.

**When NOT to use:** Use `Textarea` for multi-line input. Use `Select` for dropdown selection.

---

## Textarea

**File:** `components/ui/textarea.tsx`

**Purpose:** Multi-line text input.

**Props:** All standard HTMLTextAreaElement props + `error` (boolean), `maxLength`.

**When to use:** Description fields, long-form text entry, notes.

---

## LoadingSpinner

**File:** `components/ui/loading-spinner.tsx`

**Purpose:** Loading indicator for async operations.

**Sizes:** `xs` (12px), `sm` (16px), `md` (24px), `lg` (36px)

**Colors:** `accent` (default), `white`, `muted`

**When to use:** Button loading states (as inline indicator), full-page loading, section loading. Always pair with meaningful text or aria-label.

**When NOT to use:** Do not use for static content that hasn't loaded yet — use `Skeleton` instead.

---

## Badge

**File:** `components/ui/badge.tsx`

**Purpose:** Status indicator, label, or count display.

**Variants:** `default` (accent), `secondary` (neutral), `success`, `warning`, `danger`, `info`, `outline`

**Sizes:** `default` (sm), `lg`

**When to use:** Status labels, notification counts, feature badges, tier indicators.

**When NOT to use:** Do not use for interactive elements. Use `Button` with `variant="ghost"` for clickable tags.

---

## Table

**File:** `components/ui/table.tsx`

**Purpose:** Structured data display.

**Sub-components:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

**Features:** Responsive with horizontal scroll on mobile. Striped rows optional via `className`.

**When to use:** Tabular data, admin lists, product listings.

**When NOT to use:** Do not use for layout. Use CSS Grid or Flexbox for layout.

---

## Modal

**File:** `components/ui/modal.tsx`

**Purpose:** Overlay dialog for focused user interaction.

**Props:** `open`, `onClose`, `title`, `size` (sm/md/lg/full), `closeOnOverlay`

**When to use:** Confirmations, forms that need focus, detail views.

**When NOT to use:** Do not use for navigation (use page routing). Do not stack modals.

---

## Drawer

**File:** `components/ui/drawer.tsx`

**Purpose:** Slide-in panel for side content.

**Props:** `open`, `onClose`, `title`, `side` (left/right), `size` (sm/md/lg)

**When to use:** Mobile navigation, filter panels, AI copilot sidebars, detail panels.

**When NOT to use:** Do not use for primary actions (use Modal).

---

## Tabs

**File:** `components/ui/tabs.tsx`

**Purpose:** Content section switching.

**Props:** `tabs` (array of `{id, label, content}`), `defaultTab`, `onChange`

**Variants:** `underline` (default, accent underline), `pills` (background toggle)

**When to use:** Grouping related but distinct content sections. Settings pages, profile sections, detail views.

---

## Progress

**File:** `components/ui/progress.tsx`

**Purpose:** Visual progress indicator.

**Props:** `value` (0–100), `size` (sm/md), `color` (accent/green/red)

**When to use:** Upload progress, profile completion, credit usage, mission progress.

---

## Avatar

**File:** `components/ui/avatar.tsx`

**Purpose:** User or entity image representation.

**Props:** `src`, `alt`, `fallback` (initials), `size` (sm/md/lg/xl)

**When to use:** User profiles, company logos, chat messages.

**When NOT to use:** Do not use for decorative icons. Use `Badge` or icon components instead.

---

## Alert

**File:** `components/ui/alert.tsx`

**Purpose:** Contextual information or feedback.

**Variants:** `info` (blue), `success` (green), `warning` (amber), `error` (red), `accent` (orange)

**Props:** `title`, `variant`, `dismissible`, `icon`

**When to use:** Form validation summaries, success messages, important notices.

**When NOT to use:** Do not use for inline validation (use form field `error` prop). Do not use for toast notifications (use `Toast`).

---

## Checkbox

**File:** `components/ui/checkbox.tsx`

**Purpose:** Binary selection input.

**Props:** All standard checkbox props + `label`, `error`

**When to use:** Multi-select options, terms acceptance, toggle settings.

---

## Switch

**File:** `components/ui/switch.tsx`

**Purpose:** Toggle between two states.

**Props:** `checked`, `onChange`, `label`, `size` (sm/md)

**When to use:** On/off settings, feature toggles, visibility controls.

**When NOT to use:** Do not use for form submissions. Use Checkbox for agreement/consent.

---

## Select

**File:** `components/ui/select.tsx`

**Purpose:** Option selection from a list.

**Props:** All standard select props + `options`, `placeholder`, `error`

**When to use:** Choosing from 3+ options. For 2-3 options, use Radio or Toggle.

---

## EmptyState

**File:** `components/ui/empty-state.tsx`

**Purpose:** Display when no data is available.

**Props:** `icon`, `title`, `description`, `action` (ReactNode for CTA)

**When to use:** Empty lists, no search results, no notifications.

**When NOT to use:** Do not use for loading states (use Skeleton or LoadingSpinner).

---

## Tooltip

**File:** `components/ui/tooltip.tsx`

**Purpose:** Short contextual help on hover/focus.

**Props:** `content` (string), `side` (top/bottom/left/right), `delay`

**When to use:** Icon-only buttons, truncated text, keyboard shortcuts.

**When NOT to use:** Do not use for critical information that must be visible. Do not use on mobile without touch support.

---

## Popover

**File:** `components/ui/popover.tsx`

**Purpose:** Floating content card triggered by click.

**Props:** `trigger` (ReactNode), `content` (ReactNode), `side`, `align`

**When to use:** Filter dropdowns, action menus, quick-edit panels.

---

## Accordion

**File:** `components/ui/accordion.tsx`

**Purpose:** Expandable/collapsible content sections.

**Props:** `items` (array of `{title, content}`), `type` (single/multiple), `defaultOpen`

**When to use:** FAQ sections, settings groups, filter categories.

---

## Radio

**File:** `components/ui/radio.tsx`

**Purpose:** Single-selection from a set of options.

**Props:** `options`, `value`, `onChange`, `name`, `direction` (vertical/horizontal)

**When to use:** 2-5 mutually exclusive options. For 5+ options, use Select.

---

## Shared Component Architecture

### Pattern

All shared components in `components/ui/` follow these conventions:

1. **Client component:** `'use client'` directive at top
2. **CN utility:** Use `cn()` from `@/lib/utils` for className merging
3. **Forward ref:** All interactive elements forward refs
4. **Default export:** Each component exports a named function (not default)
5. **TypeScript:** Full prop typing with exported Props interface
6. **Loading state:** Components accept `loading` prop where applicable
7. **No side effects:** Components never fetch data or access stores

### Component Composition

Components compose via standard React children pattern:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Input label="Name" />
    <Button>Save</Button>
  </CardContent>
</Card>
```

### Customization

Consumers customize via:
1. **`className` prop** — merges with default classes via `cn()`
2. **`variant` prop** — switches between predefined style sets
3. **`size` prop** — adjusts dimensions within variant
