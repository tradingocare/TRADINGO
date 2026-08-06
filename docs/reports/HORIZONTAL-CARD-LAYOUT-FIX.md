# Horizontal Card Layout Fix

## Problem

The V2 horizontal `ProductCard` was rendered inside multi-column grids (`grid-cols-3`, `grid-cols-4`), causing layout breakage — compressed cards, overlapping content, broken horizontal layout.

## Solution

Introduced two card variants switched by view mode:

| View Mode | Card Component | Layout | Container |
|---|---|---|---|
| **Grid** | `CompactProductCard` | Vertical, compact | Multi-column grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`) |
| **List** | `ProductCard` (V2) | Horizontal, 35/65 | Single column (`flex flex-col`) |

---

## Files Modified

| File | Change |
|---|---|
| `apps/web/components/product/compact-product-card.tsx` | **NEW** — Compact grid-optimized card for grid view |
| `apps/web/components/discovery/ProductDiscoveryClient.tsx` | Updated — imports `CompactProductCard`, switches between compact (grid) and V2 (list) based on `viewMode` |
| `apps/web/app/categories/[slug]/page.tsx` | Updated — uses `CompactProductCard` in 4-column grid (no view toggle) |
| `apps/web/components/product/related-products.tsx` | Updated — uses `CompactProductCard` in horizontal scroll (no view toggle) |

---

## Grid View Behavior

**Desktop** (`xl`): 3 columns of compact cards
**Tablet** (`sm`): 2 columns of compact cards
**Mobile**: 1 column of compact cards

```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Compact │ │ Compact │ │ Compact │
│ Card    │ │ Card    │ │ Card    │
└─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Compact │ │ Compact │ │ Compact │
│ Card    │ │ Card    │ │ Card    │
└─────────┘ └─────────┘ └─────────┘
```

## List View Behavior

**Desktop**: Single column, full-width horizontal cards
**Tablet**: Single column, full-width horizontal cards
**Mobile**: Responsive stacked layout

```
┌─────────────────────────────────────┐
│ IMAGE 35% │ Content 65%             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ IMAGE 35% │ Content 65%             │
└─────────────────────────────────────┘
```

---

## CompactProductCard Design

- Vertical layout (image top, content bottom)
- `aspect-[4/3]` image with carousel
- Title, price with discount, rating, unit/MOQ
- Seller name with link to `/companies/[slug]`
- 5-icon action bar (Buy, RFQ, Chat, Save, Compare)
- Consistent with V2 light theme (`#FF5A1F` primary, `#E9E9E9` borders)
- `h-full` for equal-height cards in grid rows

---

## Before vs After

### Before (Broken)
```
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ V2 HORIZONTAL CARD  │ │ V2 HORIZONTAL CARD  │ │ V2 HORIZONTAL CARD  │
│ Compressed in 1/3   │ │ Compressed in 1/3   │ │ Compressed in 1/3   │
│ Buttons overflow    │ │ Buttons overflow    │ │ Buttons overflow    │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### After — Grid View (Default)
```
┌────────────┐ ┌────────────┐ ┌────────────┐
│ IMG        │ │ IMG        │ │ IMG        │
│ Title      │ │ Title      │ │ Title      │
│ ₹Price     │ │ ₹Price     │ │ ₹Price     │
│ [Buy][RFQ] │ │ [Buy][RFQ] │ │ [Buy][RFQ] │
└────────────┘ └────────────┘ └────────────┘
```

### After — List View
```
┌──────────────────────────────────────────────┐
│ IMAGE 35% │ Title | ₹Price | Seller | Actions │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ IMAGE 35% │ Title | ₹Price | Seller | Actions │
└──────────────────────────────────────────────┘
```

---

## Responsive Verification

| Breakpoint | Grid View | List View |
|---|---|---|
| Desktop (1280px+) | 3 columns compact | 1 column horizontal |
| Tablet (640-1279px) | 2 columns compact | 1 column horizontal |
| Mobile (<640px) | 1 column compact | 1 column stacked |

No compressed cards, no image cropping, no overlapping buttons.

---

## Verification

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ PASS |
| ESLint (`eslint`) | ✅ PASS (zero errors in modified files) |
| Next Build (`next build`) | ✅ PASS (5 pre-existing RFQ errors only) |
| Grid renders `CompactProductCard` | ✅ |
| List renders V2 `ProductCard` | ✅ |
| Categories page uses compact | ✅ |
| Related products uses compact | ✅ |
| No horizontal card in grid container | ✅ |
