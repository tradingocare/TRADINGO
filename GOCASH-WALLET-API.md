# GOCASH™ Enterprise Wallet API & Financial Operations Layer

## Architecture Overview

The Wallet API is the official financial operations interface for the entire TRADINGO
ecosystem. It wraps the GOCASH Ledger Engine and provides buyer, seller, and admin
endpoints for wallet management, transaction search, statement generation, fraud
monitoring, and analytics.

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Wallet API Layer (/wallet/)                     │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Buyer       │  │  Seller      │  │  Admin                   │  │
│  │  Endpoints   │  │  Endpoints   │  │  Endpoints               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬──────────────┘  │
│         │                 │                       │                 │
│  ┌──────┴─────────────────┴───────────────────────┘                 │
│  │                     WalletApiService                             │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  │Statement │ │Search    │ │Analytics │ │Fraud Detection   │  │
│  │  │Generator│ │Engine    │ │Engine    │ │Engine            │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  └──────────────────────────┬──────────────────────────────────────│
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────────┐│
│  │                    GOCASH Ledger Engine                          ││
│  │       gocashService.credit() / debit() / getLedger()             ││
│  └──────────────────────────┬──────────────────────────────────────┘│
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────────┐│
│  │                    GOCASH Wallet + Transaction                   ││
│  │                    (Prisma Models)                               ││
│  └─────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

## Module Location

| Component | Path |
|-----------|------|
| Service | `apps/api/src/modules/wallet-api/wallet-api.service.ts` |
| Controller | `apps/api/src/modules/wallet-api/wallet-api.controller.ts` |
| Module | `apps/api/src/modules/wallet-api/wallet-api.module.ts` |
| DTOs | `apps/api/src/modules/wallet-api/dto/` |
| Frontend API | `apps/web/lib/api/wallet.ts` |
| Frontend hooks | `apps/web/hooks/use-wallet.ts` |
| Admin pages | `apps/web/app/admin/wallets/` (list, detail) |
| Buyer page | `apps/web/app/buyer/gocash/` (wallet dashboard) |
| Seller page | `apps/web/app/seller/gocash/` (wallet dashboard) |

## API Endpoints

All endpoints are under the `/wallet/` prefix.

### Buyer Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/wallet/buyer/summary` | Full wallet summary with balance and recent transactions |
| `GET` | `/wallet/buyer/balance` | Quick balance (current, available, pending, locked) |
| `GET` | `/wallet/buyer/transactions` | Paginated transaction history with filters |
| `GET` | `/wallet/buyer/rewards` | Reward transactions only (credits) |
| `GET` | `/wallet/buyer/statement` | Statement for a period (monthly/quarterly/yearly/custom) |

### Seller Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/wallet/seller/summary` | Full wallet summary with balance |
| `GET` | `/wallet/seller/transactions` | Paginated transaction history |
| `GET` | `/wallet/seller/statement` | Period statement |
| `GET` | `/wallet/seller/analytics` | Earnings breakdown by category (membership, referral, campaign) |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/wallet/admin/wallets` | Search wallets by ID, user, company, status |
| `GET` | `/wallet/admin/wallets/:walletId` | Wallet detail with all balances and stats |
| `POST` | `/wallet/admin/wallets/:walletId/freeze` | Freeze/lock a wallet |
| `POST` | `/wallet/admin/wallets/:walletId/unfreeze` | Unfreeze a wallet |
| `POST` | `/wallet/admin/credit` | Manual credit to any wallet |
| `POST` | `/wallet/admin/debit` | Manual debit from any wallet |
| `POST` | `/wallet/admin/adjust` | Balance adjustment (positive=credit, negative=debit) |
| `POST` | `/wallet/admin/reverse` | Reverse a transaction |
| `GET` | `/wallet/admin/ledger` | Search all ledger transactions with filters |
| `GET` | `/wallet/admin/fraud-alerts` | Fraud monitoring dashboard |
| `GET` | `/wallet/admin/wallets/:walletId/audit` | Full wallet audit trail |

### Statement Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/wallet/statement` | Generate statement (monthly/quarterly/yearly/custom) |
| `GET` | `/wallet/statement/csv` | Download statement as CSV |

### Analytics Endpoints (Admin)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/wallet/analytics/growth` | Wallet growth metrics (total, new, volume) |
| `GET` | `/wallet/analytics/distribution` | Transaction type distribution |
| `GET` | `/wallet/analytics/top-wallets` | Top wallets by lifetime earnings |
| `GET` | `/wallet/analytics/redemption-trends` | Redemption trends (30d) |

## Data Models

### WalletSummary (Buyer/Seller)
```typescript
{
  id: string;
  balance: number;          // Current wallet balance
  available: number;        // Available for use
  pending: number;          // Pending settlement
  locked: number;           // Locked balance
  lifetimeEarned: number;   // Total earned all time
  lifetimeRedeemed: number; // Total redeemed all time
  status: string;           // ACTIVE, LOCKED, SUSPENDED, EXPIRED
  recentTransactions: LedgerEntry[]; // Last 5 transactions
}
```

### LedgerEntry
```typescript
{
  id: string;
  walletId: string;
  direction: 'CREDIT' | 'DEBIT';
  status: string;
  type: string;             // GOCASHTransactionType
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  actorId: string;
  actorType: string;
  idempotencyKey: string | null;
  createdAt: string;
}
```

### WalletStatement
```typescript
{
  walletId: string;
  period: string;
  from: string;
  to: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactions: LedgerEntry[];
}
```

### AdminWalletDetail
```typescript
{
  id: string;
  userId: string;
  companyId: string | null;
  type: string;
  currentBalance: number;
  availableBalance: number;
  pendingBalance: number;
  lockedBalance: number;
  expiredBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lifetimeExpired: number;
  status: string;
  kycVerified: boolean;
  lockedUntil: string | null;
  createdAt: string;
  transactionCount: number;
  redemptionCount: number;
}
```

### SellerAnalytics
```typescript
{
  totalTransactions: number;
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  membershipRewards: { count: number; total: number };
  referralRewards: { count: number; total: number };
  campaignRewards: { count: number; total: number };
  byType: Record<string, { count: number; total: number }>;
}
```

## Search & Filtering

### Wallet Search (`GET /wallet/admin/wallets`)
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Searches wallet ID, userId, companyId |
| `status` | enum | ACTIVE, LOCKED, SUSPENDED, EXPIRED |
| `userId` | UUID | Exact user ID |
| `companyId` | UUID | Exact company ID |
| `page` | number | Page number (default 1) |
| `limit` | number | Page size (default 20) |

### Ledger Search (`GET /wallet/admin/ledger`)
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Searches transaction ID, walletId, referenceId |
| `direction` | enum | CREDIT, DEBIT |
| `status` | enum | PENDING, SUCCESS, FAILED, REVERSED |
| `type` | enum | GOCASHTransactionType (16 values) |
| `referenceId` | string | Filter by reference entity ID |
| `referenceType` | string | Filter by reference module |
| `sourceSystem` | string | Filter by source system |
| `walletId` | UUID | Filter by wallet |
| `from` | ISO date | Start date |
| `to` | ISO date | End date |

## Statement Generation

### Supported Periods
| Period | Range |
|--------|-------|
| `monthly` | Current month to date |
| `quarterly` | Current quarter to date |
| `yearly` | Current year to date |
| `custom` | Custom from/to dates |

### Statement Fields
- Opening balance (balance before first transaction in period)
- Closing balance (current wallet balance)
- Total credits and debits in period
- Net change
- Transaction count
- Full transaction list with chronological entries

### CSV Export
```bash
GET /wallet/statement/csv?period=monthly
```
Returns a CSV file with headers: `Date,Type,Direction,Amount,BalanceBefore,BalanceAfter,Reason,Reference,ReferenceType,Status`

## Fraud Detection

### Monitoring Metrics (24h window)
| Metric | Threshold | Description |
|--------|-----------|-------------|
| High velocity | >50 txns/wallet | Rapid transaction activity |
| Failed rate | >10 failures | High failure rate |
| Reversal rate | >5 reversals | Unusual reversal activity |

### Fraud Alert Response
```typescript
{
  alerts: string[];
  highVelocity: Array<{
    walletId: string;
    transactionCount: number;
    alert: string;
  }>;
  failedAttempts: number;
  reversedCount: number;
  totalTransactions: number;
}
```

## Security

| Measure | Implementation |
|---------|---------------|
| JWT Auth | `@UseGuards(JwtAuthGuard)` on all endpoints |
| RBAC | `@Roles('ADMIN')` on all admin endpoints |
| Ownership validation | Wallet resolution via JWT user ID for buyer/seller endpoints |
| Idempotency | Delegated to GocashService (credit/debit check idempotency keys) |
| Audit trail | GOCASH_Transaction records all mutations |
| Rate limiting | Prisma transaction-level concurrency control |

## Pagination

### Request Parameters
- `page`: Page number (default 1)
- `limit`: Page size (default 20)

### Response Format
```typescript
{
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

Matches the existing `PaginatedResponse<T>` type in `apps/web/lib/api/types.ts`.

## Frontend Pages

| Page | Path | Description |
|------|------|-------------|
| Buyer Wallet | `/buyer/gocash` | Balance, transaction history, statement download |
| Seller Wallet | `/seller/gocash` | Balance, earnings by category, transaction history |
| Admin Wallet Console | `/admin/wallets` | Wallet search, fraud monitoring, top wallets |
| Admin Wallet Detail | `/admin/wallets/[id]` | Wallet details, freeze/unfreeze, manual credit/debit |

## Integration

| Module | Integration |
|--------|-------------|
| **GOCASH Ledger Engine** | `GocashService.credit()`, `GocashService.debit()`, `GocashService.getLedger()`, `GocashService.reverse()` |
| **Campaign Engine** | Campaign rewards processed via `GOCASHTransactionType.CAMPAIGN_REWARD` through the ledger |
| **Referral Engine** | Referral rewards processed via `GOCASHTransactionType.REFERRAL_REWARD` through the ledger |
| **Legacy GoCash** | NOT integrated — legacy module remains but all new code uses Wallet API |
| **Notifications** | Ready for NotificationService integration (planned) |

## Future Public API

The Wallet API is designed as the canonical financial interface for:

- **TRADGO™** — Driver/merchant payout processing
- **AI Commerce** — Dynamic reward distribution
- **Mobile Apps** — RESTful wallet access
- **Partner APIs** — White-label wallet integration
- **Global Trade** — Cross-border financial operations

No direct wallet mutations should bypass this layer. All future modules must consume
`WalletApiService` or the HTTP endpoints under `/wallet/`.

## Verification

```bash
cd apps/api && npx tsc --noEmit                     # 0 errors ✅
cd apps/web && npx tsc --noEmit                     # 0 errors ✅
npx eslint apps/api/src/modules/wallet-api --ext .ts # 0 errors, 16 warnings ✅
cd apps/web && npx next build                       # 179 routes ✅
```

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `apps/api/src/modules/wallet-api/wallet-api.service.ts` | ~560 | Core service with all wallet operations |
| `apps/api/src/modules/wallet-api/wallet-api.controller.ts` | ~176 | 30+ endpoints under /wallet/ |
| `apps/api/src/modules/wallet-api/wallet-api.module.ts` | ~12 | Module registering with GocashModule |
| `apps/api/src/modules/wallet-api/index.ts` | ~3 | Module exports |
| `apps/api/src/modules/wallet-api/dto/wallet-search.dto.ts` | ~90 | DTOs with class-validator decorators |
| `apps/api/src/modules/wallet-api/dto/index.ts` | ~2 | DTO exports |
| `apps/web/lib/api/wallet.ts` | ~215 | Frontend API client (20+ functions) |
| `apps/web/hooks/use-wallet.ts` | ~105 | React Query hooks (20+ hooks) |

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Added `WalletApiModule` import and registration |
| `apps/web/app/buyer/gocash/page.tsx` | Rewired to use `useBuyerWalletSummary` + `useBuyerTransactions` |
| `apps/web/app/seller/gocash/page.tsx` | Rewired to use `useSellerWalletSummary` + `useSellerTransactions` + `useSellerAnalytics` |

## New Frontend Pages

| Page | Path | Description |
|------|------|-------------|
| Admin Wallet Console | `/admin/wallets` | Wallet search, fraud alerts, top wallets, growth stats |
| Admin Wallet Detail | `/admin/wallets/[id]` | Full detail, freeze/unfreeze, manual credit/debit |
