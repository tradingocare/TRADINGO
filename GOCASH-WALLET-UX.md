# GOCASH Premium Wallet UX — v1.0

## Overview

Premium wallet experience for the TRADINGO GOCASH™ rewards system. Reusable components and enhanced pages built on top of the Phase 15A.7 Wallet API layer.

## Files

### Reusable Components (`apps/web/components/wallet/`)

| Component | File | Purpose |
|---|---|---|
| `WalletTransactionFilters` | `wallet-transaction-filters.tsx` | Direction/type/date range filter bar for transaction tables |
| `WalletTimeline` | `wallet-timeline.tsx` | Chronological reward activity list with direction icons |
| `WalletAnalyticsBar` | `wallet-analytics-bar.tsx` | Gradient progress bar visualization for distribution data |

### Enhanced Pages

| Page | Route | Role | Premium Features Added |
|---|---|---|---|
| Buyer GOCASH | `/buyer/gocash` | Buyer | Quick action cards (Campaigns, Referrals, Redeem, Statement), transaction filters, reward timeline, wallet overview bars, campaign/referral center cards, statement period picker |
| Seller GOCASH | `/seller/gocash` | Seller | Quick action cards (Campaigns, Referrals, Products, Analytics), reward breakdown visualization, by-type distribution bars, quick stats panel, transaction filters, statement period picker |
| Admin Console | `/admin/wallets` | Admin | Collapsible fraud center with high-velocity wallet list, ledger explorer (global transaction search with filters), distribution by type bars, redemption trends panel, system monitor collapsible section, wallet search |
| Admin Detail | `/admin/wallets/[id]` | Admin | Collapsible ledger explorer (wallet-specific timeline), collapsible audit trail, wallet summary grid |

## Design Decisions

- **No chart library** — All visualizations use pure Tailwind CSS (gradient progress bars, card-based stats, inline indicators). Consistent with existing TRADINGO dark theme.
- **Reusable components** — Three components shared across buyer/seller/admin pages. `WalletTransactionFilters` handles direction/type/date filters uniformly.
- **Collapsible sections** — Fraud Monitoring, Ledger Explorer, System Monitor, and Audit Trail use collapsible cards to reduce clutter.
- **Quick action cards** — Gradient-background cards link to Campaigns, Referrals, and other modules — connecting the wallet UI to the broader platform.
- **Filters with Apply/Reset** — Filters are stored as pending state and only applied on button click, preventing excessive API calls.
- **Statement period picker** — Monthly/Quarterly/Yearly dropdown in page header controls the statement download endpoint.

## Screen Flow

```
Buyer GOCASH
├── Balance Stats (4 cards)
├── Quick Actions (4 gradient cards → Campaigns, Referrals, Redeem, Statement)
├── Main Area
│   ├── Transaction History (filters + table + pagination)
│   └── Sidebar
│       ├── Recent Activity (timeline component)
│       └── Wallet Overview (distribution bars)
└── Bottom Cards
    ├── Campaign Center (→ /buyer/campaigns)
    └── Referral Center (→ /buyer/referrals)

Seller GOCASH
├── Balance Stats (4 cards)
├── Quick Actions (4 gradient cards → Campaigns, Referrals, Products, Analytics)
├── Analytics Grid (3 cards)
│   ├── Reward Breakdown (bars)
│   ├── By Transaction Type (bars)
│   └── Quick Stats (summary panel)
└── Transaction History (filters + table + pagination)

Admin Wallet Console
├── System Stats (5 cards)
├── Wallet Search + Top Wallets (2-column)
├── Fraud Monitoring (collapsible, alerts + stats + high-velocity wallets)
├── Ledger Explorer (collapsible, global search + filters + table)
├── Distribution + Redemption Trends (2-column analytics)
└── System Monitor (collapsible, growth stats)

Admin Wallet Detail
├── Balance Stats (5 cards)
├── Manual Credit + Manual Debit (2-column)
├── Ledger Explorer (collapsible, wallet timeline)
├── Audit Trail (collapsible, action log)
└── Wallet Summary (attribute grid)
```

## Data Flow

All pages consume existing Wallet API hooks from `use-wallet.ts`:
- `useBuyerWalletSummary`, `useBuyerTransactions`, `useBuyerStatement`
- `useSellerWalletSummary`, `useSellerTransactions`, `useSellerAnalytics`, `useSellerStatement`
- `useSearchWallets`, `useGrowthAnalytics`, `useFraudAlerts`, `useTopWallets`, `useSearchLedger`, `useDistributionAnalytics`, `useRedemptionTrends`
- `useWalletDetail`, `useFreezeWallet`, `useUnfreezeWallet`, `useManualCredit`, `useManualDebit`, `useAdjustBalance`, `useWalletAudit`

No new API endpoints were created — Phase 15A.8 is purely UI/UX.

## Future Enhancements

- **Real chart library** — Install recharts/chart.js when TRADINGO design system adopts data visualization
- **Mobile wallet view** — Responsive redesign for mobile wallets
- **Export to PDF** — Server-side PDF statement generation
- **Push notifications** — Real-time wallet updates via WebSocket
- **Wallet comparison** — Admin tool to compare two wallets side-by-side
- **Gamification** — Badges, streak counters, tier progress bars on buyer/seller dashboards
