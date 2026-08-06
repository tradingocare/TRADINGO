# Executive Command Center — Dashboard Wireframe

## Overview

The Command Center is a single-page dashboard that replaces the current `/admin/dashboard`. It aggregates the most critical 30+ KPIs from all 19 intelligence domains into a unified view. It is NOT a replacement for `/admin/founder-ai`, `/founder/executive`, or `/founder/intelligence` — those remain as deep-dive pages.

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🏛️ FOUNDER COMMAND CENTER          Last updated: 2m ago [↻]   │
│                                                                  │
│  [Alert Banner — if active alerts exist]                        │
│  ⚠️ 3 critical alerts | 5 warnings | 1 info                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │Revenue│ │Orders│ │Users │ │Cos   │ │RFQs  │ │AI Req│ │Hlth│ │
│  │₹12.4L │ │  847 │ │2,341 │ │  892 │ │  156 │ │ 1.2K │ │ 78 │ │
│  │ +8.3%▲│ │+12%▲ │ │+5%▲  │ │+3%▲  │ │-2%▼  │ │+22%▲ │ │ B+ │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └────┘ │
│                                                                  │
│  ┌─────────────────────────────────────┐ ┌───────────────────┐  │
│  │ Revenue 30-Day Trend                │ │ Orders 30-Day     │  │
│  │ [LINE CHART — 30 data points]       │ │ [BAR CHART — 30d] │  │
│  │ ▲ ₹8.4L → ₹12.4L (+47% MoM)        │ │ ██ 847 total      │  │
│  └─────────────────────────────────────┘ └───────────────────┘  │
│  ┌─────────────────────────────────────┐ ┌───────────────────┐  │
│  │ User Growth 30-Day                  │ │ AI Usage Trend    │  │
│  │ [LINE CHART — users + companies]    │ │ [AREA CHART — 30d]│  │
│  │ ▲ 2,341 users, 892 companies        │ │ ██ 1.2K requests  │  │
│  └─────────────────────────────────────┘ └───────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PLATFORM HEALTH                     SCORE: 78/100 (B+)   │   │
│  │ [GAUGE VISUAL — 0-100]                                   │   │
│  │                                                           │   │
│  │ Marketplace  ████████████████░░░░ 82%  ▲ improving       │   │
│  │ Trust        ████████████░░░░░░░░ 65%  ▼ declining       │   │
│  │ Growth       █████████████████░░░ 88%  ▲ improving       │   │
│  │ Community    ██████████░░░░░░░░░░ 52%  ◻ stable          │   │
│  │ AI Platform  ████████████████░░░░ 80%  ◻ stable          │   │
│  │ System       ████████████████░░░░ 85%  ▲ improving       │   │
│  │ Revenue      █████████████████░░░ 91%  ▲ improving       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────┐ ┌───────────────────┐   │
│  │ ALERTS & INTELLIGENCE              │ │ EXECUTIVE         │   │
│  │ [🔴] Revenue drop (3d) -2.1%      │ │ PRIORITIES        │   │
│  │ [🟡] AI latency P95 12.3s > 10s   │ │                    │   │
│  │ [🟡] Dispute rate 4.1% > 3%       │ │ 1. ⚡ Onboard 20   │   │
│  │ [🔵] 15 expiring subs next 30d    │ │    sellers in      │   │
│  │ [🔵] 8 pending verifications 5d+  │ │    undersupplied   │   │
│  │                                    │ │    categories      │   │
│  │                                    │ │ 2. ⚡ Resolve      │   │
│  │                                    │ │    verification    │   │
│  │                                    │ │    backlog (8)     │   │
│  │                                    │ │ 3. ⚡ Address      │   │
│  │                                    │ │    AI latency      │   │
│  │                                    │ │    degradation     │   │
│  │                                    │ │ ...                │   │
│  └────────────────────────────────────┘ └───────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ RECENT ACTIVITY                                            │  │
│  │                                                            │  │
│  │ 2m ago  🛒 Order #ORD-8921  ₹45,000  — Acme Corp          │  │
│  │ 5m ago  📋 RFQ #RFQ-452  opened — 3 quotes received       │  │
│  │ 8m ago  👤 New seller: PQR Industries (Metals)             │  │
│  │ 12m ago 🔄 AI copilot used: 45 requests in last hour      │  │
│  │ 15m ago 💰 Payment received: ₹1,20,000 — XYZ Traders       │  │
│  │ 20m ago ⚠️ Dispute opened: #DSP-89 — ₹12,000              │  │
│  │ 25m ago ✅ 5 new products listed by GreenFarm Organics     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ QUICK ACTIONS                                            │   │
│  │ [Review Verification] [View Disputes] [Manage Users]     │   │
│  │ [AI Console] [Finance Ops] [Export Report]               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Section Details

### 1. Top Navigation Bar
- Title: "Founder Command Center"
- Last updated timestamp (auto-refresh indicator)
- Manual refresh button [↻]
- Link to deep-dive pages: AI Insights, Executive Agent, Enterprise Intelligence

### 2. Alert Banner (Conditional)
- Only shown when active alerts exist
- Red/amber/blue indicators for critical/warning/info
- Click → scroll to Alerts section

### 3. Metric Cards Row (8 cards, equal width)
Each card: Icon + KPI name + Value + Change % + Trend arrow
- **Revenue**: Current 30d revenue | MoM change
- **Orders**: Total orders (30d) | MoM change
- **Users**: Total active users | MoM change
- **Companies**: Total active companies | MoM change
- **RFQs**: Active open RFQs | MoM change
- **AI Requests**: AI calls (24h) | MoM change
- **Trust Score**: Avg trust score (capped 100) | MoM change
- **Health Index**: Composite score (0-100) | Grade letter

All cards are clickable → navigate to relevant admin page.

### 4. Chart Row (4 charts, 2×2 grid)
- **Revenue 30-Day**: Line chart, daily revenue | 7-day moving average overlay
- **Orders 30-Day**: Bar chart, daily order count | Target line overlay
- **User Growth 30-Day**: Dual line chart (users + companies) | Cumulative
- **AI Usage 30-Day**: Area chart, daily AI requests | Success rate overlay (%)

### 5. Platform Health Section
- Gauge visualization: 0-100 with color zones (red <50, amber 50-75, green 75-100)
- Grade: A/B+/B/C+/C/D
- 7 dimension rows: Name + progress bar + score + trend arrow
- Each dimension clickable → tooltip with breakdown

### 6. Alerts & Priorities (2-column)
**Left — Alerts**: Severity-coded list of active alerts
- Each alert: Icon + title + detail + timestamp
- Click → navigate to relevant admin page
- Max 10 alerts, sorted by severity then recency

**Right — Executive Priorities**: Top-5 ranked priorities
- Rank + title + impact area + effort estimate
- Click → AI recommendation detail in `/admin/founder-ai`

### 7. Recent Activity Feed
- Latest 20 platform events
- Event types: Order, RFQ, Registration, AI, Payment, Dispute, Product, System
- Each row: Timestamp + icon + description + link
- Auto-scrolls to show latest (newest at top)

### 8. Quick Actions Bar
- 6 action buttons linking to key admin pages
- "Review Verification" → `/admin/verification`
- "View Disputes" → `/admin/disputes`
- "Manage Users" → `/admin/users`
- "AI Console" → `/admin/ai-console`
- "Finance Ops" → `/admin/finance`
- "Export Report" → `/admin/founder-ai/report`

## Responsive Behavior

### Desktop (1200px+)
- 7-column metric cards row
- 2×2 chart grid
- 2-column alerts/priorities
- Full activity feed

### Tablet (768-1199px)
- 4-column metric cards (2 rows)
- 1-column chart stack
- Single column alerts
- Truncated activity (10 items)

### Mobile (<768px)
- 2-column metric cards (4 rows)
- Single chart at a time (carousel)
- Alerts collapsed with count badge
- Activity collapsed with "Show more"

## Color Scheme (TRADINGO Design Tokens)
- Background: `bg-bg-base` (#00001C)
- Cards: `bg-surface` (#00072D)
- Borders: `border-border`
- Text: `text-text-primary` / `text-text-secondary`
- Accent: `accent` (orange)
- Positive: `text-green-400`
- Negative: `text-red-400`
- Warning: `text-amber-400`
- Charts: accent gradient (orange/amber)

## Loading States

```
┌──────────────────────────────────────────────────────────────┐
│  🏛️ FOUNDER COMMAND CENTER               [Skeleton pulse]   │
├──────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │██████│ │██████│ │██████│ │██████│ │██████│ │██████│     │
│  │██████│ │██████│ │██████│ │██████│ │██████│ │██████│     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  ┌────────────────────────────────┐ ┌────────────────────┐   │
│  │████████████████████████████████│ │████████████████████│   │
│  │████████████████████████████████│ │████████████████████│   │
│  └────────────────────────────────┘ └────────────────────┘   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │████████████████████████████████████████████████████████│   │
│  │████████████████████████████████████████████████████████│   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

Skeleton loads instantly. Each section reveals as data arrives (progressive loading). Critical metric cards load first (revenue, orders, users), then charts, then health, then alerts/activity.

## Error States

If unified endpoint fails entirely:
```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Could not load Command Center data.                      │
│  [Retry] [View cached data] [Go to Admin Dashboard]          │
└──────────────────────────────────────────────────────────────┘
```

If individual sub-request fails:
- That section shows "Unable to load" with icon
- Other sections render normally
- Retry button on failed section only

## Empty States

First day of platform (no data):
- Charts show "No data yet — start by onboarding sellers"
- Metric cards show — (dash) instead of 0
- Activity feed shows "No recent activity"
- Health gauge shows "Insufficient data"

## API Integration

Primary: `GET /founder/intelligence/unified` (new)
- Returns all KPIs, health score, alerts, priorities, activity feed
- 60s Redis cache
- Response size ~15-20KB

Fallback: Individual endpoints if unified fails
- `GET /admin/founder-ai/health-score`
- `GET /admin/founder-ai/priorities`
- `GET /admin/founder-ai/marketplace-intelligence`
- `GET /admin/founder-ai/risk-intelligence`

Charts: `GET /founder/intelligence/chart/:type?days=30`
- Returns time-series data for 4 chart types
- revenue, orders, users, ai-usage

## Implementation Notes

- **Framework**: Same as current admin pages (Next.js App Router, server components where possible)
- **Charts**: Recharts (already in dependencies)
- **Data Fetching**: React Query with 60s staleTime, refetchInterval: 60000
- **State Management**: URL search params for tab/date-range state
- **Performance**: 8s timeout for unified endpoint, progressive rendering
- **Accessibility**: ARIA labels on all interactive elements, keyboard navigation, prefers-reduced-motion
