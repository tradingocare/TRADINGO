# HARDCODED DATA AUDIT — TRADINGO Web App

Generated: 2026-06-23
Scope: `apps/web/`

---

## ZERO TOLLERANCE VIOLATIONS (SAMPLE_ / MOCK_ / DUMMY_)
**None found.** All `SAMPLE_*`, `MOCK_*`, `DUMMY_*` prefixes have been eliminated.

---

## CRITICAL DUPLICATES (data already in master-data.ts / lib/data/ but redefined locally)

| File | Line | Variable | Status |
|------|------|----------|--------|
| `components/shared/trading-engines.tsx` | 26 | `engines` | Already in `lib/data/tradhexa-engines.ts` |
| `components/shared/live-stats.tsx` | 15 | `defaultStats` | Already in `MASTER_PLATFORM_STATS` |
| `components/sections/IndiaHubs.tsx` | 22 | `topStatCards` | Already in `MASTER_PLATFORM_STATS.indiaStats` |
| `components/sections/HeroSection.tsx` | 28 | `VENDOR_SLIDES` | Missing from master-data.ts |
| `components/shared/navbar.tsx` | 74 | `socialLinks` | Already in `FOOTER_SOCIAL_LINKS` |

## HOMEPAGE (app/page.tsx)

| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 36 | `sellerBenefits` | ~38 | 6 objects (icon, title, description) |
| 76 | `buyerBenefits` | ~38 | 6 objects (icon, title, description) |
| 116 | `successStories` | ~30 | 4 testimonials |
| 201 | inline JSX | ~6 | 4 "Why TRADINGO" features |
| 287 | inline JSX | ~5 | 3 GOCASH features |
| 366 | inline JSX | ~6 | 4 TRADGO badges |
| 426 | inline JSX | ~24 | 4 loyalty tiers |

## MARKETING PAGES

### trading/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 20 | `features` | ~38 | 6 feature objects |
| 60 | `rfqSteps` | ~5 | 4 step objects |
| 67 | `stats` | ~4 | 4 stat objects |
| 99 | inline | ~5 | 3 trust features |
| 127 | inline | ~1 | 8 category strings |
| 177 | inline | ~1 | 10 city strings |
| 210-299 | inline | ~90 | Benefit items |

### about-tradingo/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 15 | `milestones` | ~8 | 6 milestone objects |
| 24 | `values` | ~31 | 6 value objects |
| 57 | `teamMembers` | ~6 | 4 team member objects |
| 64 | `testimonialsData` | ~20 | 4 testimonials |

### why-tradingo/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 13 | `differentiators` | ~68 | 6 differentiators with detail sub-arrays |
| 82 | `comparisonData` | ~11 | 9 comparison objects |

### features/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 16 | `sellerFeatures` | ~38 | 6 feature objects |
| 56 | `buyerFeatures` | ~38 | 6 feature objects |
| 95 | `platformFeatures` | ~40 | 6 feature objects |
| 140 | `trustFeatures` | ~40 | 6 feature objects |

### for-sellers/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 18 | `sellerFeatures` | ~50 | 8 feature objects |
| 70 | `sellerPlans` | ~50 | 3 pricing plan objects |
| 122 | `onboardingSteps` | ~5 | 4 step objects |

### for-buyers/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 17 | `buyerFeatures` | ~50 | 8 feature objects |
| 69 | `rfqSteps` | ~5 | 4 step objects |

### seller-plans/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 15 | `plans` | ~54 | 3 pricing plan objects |
| 70 | `compareFeatures` | ~12 | 10 comparison objects |
| 83 | `faqs` | ~20 | 4 FAQ objects |

### tradgo/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 16 | `badges` | ~37 | 6 badge objects |
| 55 | `leaderboardPrizes` | ~25 | 3 prize objects |
| 90 | `raceFeatures` | ~22 | 3 feature objects |

### tradbuy/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 17 | `features` | ~33 | 6 feature objects |
| 52 | `steps` | ~18 | 4 step objects |
| 80 | `benefits` | ~20 | 4 benefit objects |
| 215 | inline | ~2 | 6 comparison strings |

### gocash/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 18 | `earnFeatures` | ~20 | 3 feature objects |
| 39 | `redemptionOptions` | ~25 | 4 option objects |
| 62 | `loyaltyTiers` | ~40 | 4 tier objects |
| 102 | `earningRates` | ~30 | 5 rate objects |

### launch/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 20 | `launchFeatures` | ~38 | 6 feature objects |
| 59 | `launchPlans` | ~54 | 3 pricing plan objects |
| 115 | `launchTestimonials` | ~30 | 4 testimonial objects |
| 146 | `launchStats` | ~5 | 4 stat objects |

### contact/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 13 | `contactMethods` | ~22 | 3 method objects |
| 37 | `businessHours` | ~4 | 3 schedule strings |

### press-kit/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 17 | `keyFacts` | ~10 | 8 fact objects |
| 28 | `brandAssets` | ~8 | 6 asset objects |
| 37 | `screenshots` | ~8 | 6 screenshot objects |
| 46 | `leadership` | ~8 | 6 leader objects |
| 55 | `pressMentions` | ~3 | 8 string array |

### terms/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 9 | `termsSections` | ~55 | Policy sections with sub-sections |

### privacy/page.tsx
| Line | Variable | Lines | Content |
|------|----------|-------|---------|
| 9 | `policySections` | ~55 | Policy sections with sub-sections |

## COMPONENT FILES

| File | Line | Variable | Lines | Content |
|------|------|----------|-------|---------|
| `components/sections/HeroSection.tsx` | 28 | `VENDOR_SLIDES` | ~100 | 5 vendor slide objects |
| `components/sections/IndiaHubs.tsx` | 22 | `topStatCards` | ~9 | 8 stat objects |
| `components/shared/trading-engines.tsx` | 26 | `engines` | ~50 | 6 engine objects |
| `components/shared/live-stats.tsx` | 15 | `defaultStats` | ~6 | 4 live stat objects |
| `components/shared/navbar.tsx` | 74 | `socialLinks` | ~7 | 6 social link objects |
| `components/dashboard/sidebar.tsx` | 110 | `sellerNavItems` | ~20 | Nav items |
| `components/dashboard/sidebar.tsx` | 130 | `buyerNavItems` | ~12 | Nav items |
| `components/dashboard/sidebar.tsx` | 142 | `adminNavItems` | ~20 | Nav items |
| `components/product-onboarding/multi-lang-editor.tsx` | 19 | `INDIAN_LANGUAGES` | ~12 | 11 language objects |
| `components/product-onboarding/certification-editor.tsx` | 17 | `CERT_TYPES` | ~8 | 7 certification types |
| `components/product-onboarding/completeness-gauge.tsx` | 41 | `categories` | ~9 | 8 category defs |
| `components/product-onboarding/variant-matrix.tsx` | 10 | `VARIANT_TYPE_OPTIONS` | ~10 | Variant type config |
| `components/product/badges-bar.tsx` | 21 | `badges` | ~20 | Badge objects |
| `components/near-me/sort-dropdown.tsx` | 12 | `SORT_OPTIONS` | ~7 | 6 sort options |
| `components/seller-locations/radius-selector.tsx` | 5 | `RADIUS_OPTIONS` | ~7 | 5 radius options |
| `components/chat/message-reactions.tsx` | 5 | `EMOJIS` | 1 | 5 emoji strings |
| `components/feedback/feedback-widget.tsx` | 14 | `tabs` | ~12 | Tab configs |

## DASHBOARD / ADMIN PAGES

| File | Line | Variable | Content |
|------|------|----------|---------|
| `app/admin/dashboard/page.tsx` | 8 | `quickLinks` | 4 link objects |
| `app/admin/fraud-dashboard/page.tsx` | 21 | `flaggedItems` | ~20 lines mock data |
| `app/admin/audit-logs/page.tsx` | 23 | `auditLogs` | ~30 lines mock data |
| `app/admin/system-health/page.tsx` | 15 | `services` | ~40 lines mock data |
| `seller/dashboard/page.tsx` | 9 | `quickActions` | 4 action objects |
| `seller/dashboard/page.tsx` | 27 | `stats` | 4 stat configs |
| `seller/tradgo/page.tsx` | 33 | `raceStats` | 4 stat objects |
| `seller/analytics/page.tsx` | 36 | `stats` | Stat configs |
| `seller/beta/support/page.tsx` | 29-30 | `CATEGORIES`, `PRIORITIES` | String arrays |
| `seller/rfqs/templates/page.tsx` | 19 | `initialTemplates` | 4 mock templates |
| `buyer/suppliers/page.tsx` | 21 | `suppliers` | ~30 lines mock data |
| `buyer/saved-products/page.tsx` | 22 | `initialProducts` | ~30 lines mock data |
| `order/[id]/page.tsx` | 66 | `timelineSteps` | 4 step objects |
| `compare/page.tsx` | 7 | `ROWS` | ~30 lines compare rows |
| `(auth)/onboarding/page.tsx` | 38 | `steps` | 3 step objects |
| `sitemap.ts` | 6 | `staticRoutes` | 6 route strings |

## INLINE JSX ARRAYS (non-extractable — purely presentational)

- `app/page.tsx` lines 201, 287, 366, 426 — feature/badge/tier cards
- `app/trading/page.tsx` lines 99, 127, 177, 210, 246 — trust features, categories, cities, benefits
- `app/tradbuy/page.tsx` lines 215, 235 — comparison string arrays
- `app/admin/analytics/page.tsx` lines 70, 96 — month labels
- `app/buyer/settings/page.tsx` lines 72, 136 — notification/theme strings
- `app/seller/products/new/wizard.tsx` lines 249, 277, 374 — category/unit/summary objects

## EXISTING CENTRALIZED DATA FILES (DO NOT MODIFY)

- `data/master-data.ts` — Main centralized data (categories, products, services, industries, cities, countries, engines, search, footer links, geo rings, platform stats)
- `lib/data/tradhexa-engines.ts` — Full engine data
- `lib/data/india-hubs.ts` — India state/hub data
- `config/specification-templates.ts` — Product spec templates (should stay as-is)

## SUMMARY

| Metric | Count |
|--------|-------|
| Unique files with hardcoded arrays | ~45 |
| Duplicate `web/app/` mirror files | ~30 |
| Total estimated hardcoded data lines | ~1,500-2,000 |
| Marketing page feature arrays | ~20+ |
| Pricing plan arrays | ~5 |
| Testimonial arrays | ~3 |
| Admin mock data arrays | ~6 |
| Component-local data arrays | ~18 |
| Inline JSX arrays (low priority) | ~15 |
