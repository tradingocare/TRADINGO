# TRADINGO Shared Component Library

> Every shared UI component in `apps/web/components/` documented with props, usage, and dependencies.

## UI Primitives (`components/ui/`)

### Button
```typescript
interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
}
```
**Dependencies**: class-variance-authority, lucide-react (Loader2 for loading)

### Badge
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md'
  children: ReactNode
}
```

### Card
```typescript
interface CardProps {
  className?: string
  children: ReactNode
  hover?: boolean
  onClick?: () => void
}
```

### Input, Textarea, Label
Standard form primitives with Tailwind styling.

### Skeleton
```typescript
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}
```

### Pagination
```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}
```

### EmptyState
```typescript
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}
```

### Toaster + useToast
Based on react-hot-toast. Usage: `toast.success('message')`, `toast.error('message')`.

### OptimizedImage
Next.js Image wrapper with Cloudinary URL transformations.

### PasswordStrength, OtpInput
Specialized input components for auth flows.

## Shared Components (`components/shared/`)

### Navbar
Main navigation bar with mega-menu, mobile responsive, role-aware (buyer/seller/admin navs from `data/master-data.ts`).

### Footer
Marketing footer with links, social, newsletter signup.

### MegaMenu
Full-width dropdown navigation for category catalog.

### VerifiedBadge
```typescript
interface VerifiedBadgeProps {
  level?: 'verified' | 'trusted' | 'premium' | 'gold' | 'elite'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

### SellerBadge, RankBadge
Seller verification level badges, ranking badges.

### TrustScoreCard
TradTrust score display with 6 dimensions.

### ErrorBoundary, ErrorState, NotFoundState
Error handling components with retry actions.

### ThemeProvider, ThemeToggle, ThemeWrapper
Dark/light theme management.

## Dashboard Components (`components/dashboard/`)

### Sidebar
Role-aware navigation sidebar with collapsible sections.

### Topbar
Dashboard header with search, notifications, user menu.

### Breadcrumbs
```typescript
interface BreadcrumbItem { label: string; href?: string }
interface BreadcrumbsProps { items: BreadcrumbItem[] }
```

### StatCard
```typescript
interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; positive: boolean }
  loading?: boolean
}
```

### StatusBadge
Unified status badge with color mapping. Uses `normalizeStatus()` for consistent status display across all entity types.

### PageHeader
Standard page header with title, subtitle, actions.

## Ecosystem Components (`components/ecosystem/`)

| Component | Props | Purpose |
|-----------|-------|---------|
| XPProgressBar | current, target, label, size | XP progress to next level |
| LevelCard | icon, name, level, xpRange, isCurrent | Clickable level display |
| BadgeCard | icon, name, description, earnedAt, size | Badge display with states |
| MissionCard | mission, progress, compact | Mission with progress/rewards |
| DailyCheckinCard | onCheckin, isLoading, streak, milestone | Check-in button |
| StreakCalendar | checkins, currentMonth, bonusDay | Month grid calendar |
| MissionCategoryTabs | active, onChange | DAILY/WEEKLY/MONTHLY tabs |
| RewardTimeline | transactions, loading | Chronological XP history |
| RewardStatistics | totalXp, badges, streak, missions | Stats grid |
| LeaderboardPodium | top3 | Rank 1-2-3 display |
| LeaderboardTable | entries, currentUserId | Ranked table |
| XP Float Animation | amount | Floating +XP animation |
| LevelUpModal | level, name, onClose | Premium level-up overlay |
| AiSuggestedMissions | recommendations | AI mission suggestions |
| DashboardEcosystemWidget | data | Dashboard intelligence |
| MembershipBenefitsCard | membership, loading | Plan benefits (11 rows) |
| PlatformIntegrationsCard | integrations, role | Integration links |

## Founder AI Components (`components/founder-ai/`)

| Component | Props | Purpose |
|-----------|-------|---------|
| MorningBriefCard | data, isLoading | Daily executive brief |
| EveningSummaryCard | data, isLoading | End-of-day summary |
| ExecutiveDashboard | data, isLoading | Full dashboard view |
| HealthScoreCard | data, isLoading | 7-dimension health score |
| ExecutivePrioritiesCard | data, isLoading | Top 10 priorities |
| ExecutiveTimelineCard | data, isLoading | 5-period timeline |
| DecisionCenterCard | data, isLoading, onAnalyze | Decision analysis |
| RiskIntelligenceCard | data, isLoading | Risk assessment |
| GrowthIntelligenceCard | data, isLoading | Growth metrics |
| FounderCopilot | onAsk, isLoading | Chat-style copilot |
| InsightPanel | insights | Aggregated insights |

## AI Copilot Components

| Component | File | Tabs |
|-----------|------|------|
| CopilotPanel | `components/ai/` | Description, SEO, Specs, Images, Translate |
| WizardCopilot | `components/ai/` | Per-step AI actions (7 steps) |
| AiSearchCopilot | `components/search/` | Discover, Similar, Recommend, Rank |
| AiFinanceCopilot | `components/finance/` | Credit, Cash Flow, Collect, Risk |
| AiAdminCopilot | `components/admin/` | Brief, Insights, Alerts, Reports |
| AiNegotiationCopilot | `components/negotiation/` | Strategy, Behaviour, Risk, Communication, Summary |
| AiRfqCopilot | `components/rfq/` | RFQ AI features |
| AiQuoteSidebar | `components/quote/` | Quote AI features |
| AiCrmCopilot | `components/crm/` | CRM AI features |

## Domain Components

### Product (`components/product/`)
- ProductCard, CompactProductCard, ProductSkeleton
- ImageGallery, Specifications, VariantSelector
- ReviewsSection, QASection, SellerCard
- ActionButtons, BadgesBar, CompareBar
- RelatedProducts, FrequentlyBought

### Near Me (`components/near-me/`)
- NearMeMap, MapView, MapSkeleton, MapToolbar, MapLegend
- MarkerPopup, RadiusCircle, RadiusSelector
- FilterDrawer, SortDropdown, NearMeProductCard
- DistanceBadge

### Discovery (`components/discovery/`)
- ProductDiscoveryClient, FilterSidebar, SearchBar
- UnifiedCard, EngineBar, NearToFarBanner

### Wallet (`components/wallet/`)
- WalletTransactionFilters, WalletTimeline, WalletAnalyticsBar

### Providers (`components/providers/`)
- Providers (root), AuthProvider, SocketProvider, PresenceProvider
- NotificationProvider, ChatProvider, TypingProvider

### Chat (`components/chat/`)
- ChatList, ChatMessage, MessageInput, MessageReactions, FileUploadInput

### Seller Locations (`components/seller-locations/`)
- LocationForm, RadiusSelector, ProductLocationTable
- BulkLocationModal, GeolocationButton, AddressSearchInput

### Product Onboarding (`components/product-onboarding/`)
- FormWizard, DynamicForm, DynamicField, FieldRenderer
- FileUploadZone, MultiLangEditor, PricingSlabs, VariantMatrix
- CompletenessGauge, CertificationEditor, AttachmentList
