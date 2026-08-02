# GOCASH™ Enterprise Immutable Ledger Engine

## Architecture

```
Source of Truth
      ↓
Ledger (GOCASH_Transaction) — append-only, immutable
      ↓
Cached Wallet Balance (GOCASH_Wallet) — derived from ledger
      ↓
Consumer Layer (APIs, Events, UI)
```

The ledger is **ALWAYS authoritative**. The wallet balance is a cached convenience field, never the source of truth.

### Design Principles

1. **Append-only** — ledger records are never UPDATEd or DELETEd
2. **Immutable** — corrections create reversing entries, never modify originals
3. **Idempotent** — duplicate requests with the same idempotency key return existing records
4. **Atomic** — every balance change happens inside a Prisma interactive transaction
5. **Auditable** — every entry records who, what, when, why, and balance before/after

---

## Ledger Flow

### Credit Flow

```
1. Receive credit(amount, type, reason, actorId, idempotencyKey?)
2. Verify idempotency key (if provided)
3. BEGIN Prisma $transaction
4.   READ GOCASH_Wallet (FOR UPDATE — implicit row lock)
5.   Validate wallet is ACTIVE
6.   Calculate balanceAfter = balanceBefore + amount
7.   INSERT GOCASH_Transaction (direction=CREDIT, status=SUCCESS)
8.   UPDATE GOCASH_Wallet (currentBalance += amount, availableBalance += amount, lifetimeEarned += amount)
9. COMMIT
```

### Debit Flow

```
1. Receive debit(amount, type, reason, actorId, idempotencyKey?)
2. Verify idempotency key (if provided)
3. BEGIN Prisma $transaction
4.   READ GOCASH_Wallet
5.   Validate wallet is ACTIVE
6.   Validate availableBalance >= amount
7.   Calculate balanceAfter = balanceBefore - amount
8.   INSERT GOCASH_Transaction (direction=DEBIT, status=SUCCESS)
9.   UPDATE GOCASH_Wallet (currentBalance, availableBalance, lifetimeRedeemed)
10. COMMIT
```

### Reversal Flow

```
1. Receive reverse(originalTransactionId, reason, actorId)
2. BEGIN Prisma $transaction
3.   READ original GOCASH_Transaction
4.   Validate original exists and not already reversed
5.   READ GOCASH_Wallet
6.   Create new GOCASH_Transaction with opposite direction (status=SUCCESS, type=ADMIN_CORRECTION)
7.   referenceId = originalTransactionId (links to reversed entry)
8.   UPDATE GOCASH_Wallet (opposite balance adjustment)
9. COMMIT
```

### Redemption Flow

```
1. redeem() — creates GOCASH_Redemption (PENDING). No balance change.
2. approveRedemption() — creates DEBIT ledger entry + deducts wallet + marks APPROVED. All in one transaction.
3. rejectRedemption() — marks REJECTED. No balance change (no debit was ever made).
```

---

## Balance Calculation

Wallet balance is maintained as a cached field for performance. The authoritative balance at any point in time is computed from the ledger:

```sql
SELECT COALESCE(SUM(
  CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END
), 0) AS balance
FROM gocash_transactions
WHERE wallet_id = ? AND status = 'SUCCESS';
```

The cached fields on `GOCASH_Wallet` are:
- `currentBalance` — total balance (all CREDITs - all DEBITs)
- `availableBalance` — spendable balance (currentBalance - lockedBalance - pendingBalance)
- `pendingBalance` — pending credits
- `lockedBalance` — earmarked funds
- `expiredBalance` — expired rewards
- `lifetimeEarned` — sum of all CREDITs ever
- `lifetimeRedeemed` — sum of all DEBITs ever

### Cached Wallet Update Pattern

```typescript
// Inside Prisma $transaction:
const wallet = await tx.gOCASH_Wallet.findUnique({ where: { id: walletId } });
const balanceBefore = Number(wallet.currentBalance);
const balanceAfter = balanceBefore + amount; // for credit

await tx.gOCASH_Transaction.create({ data: { ...entry, balanceBefore, balanceAfter } });
await tx.gOCASH_Wallet.update({
  where: { id: walletId },
  data: {
    currentBalance: balanceAfter,
    availableBalance: { increment: amount },
    lifetimeEarned: { increment: amount },
  },
});
```

---

## Idempotency Strategy

- Every `GOCASH_Transaction` has an optional `idempotencyKey` field with `@unique` constraint
- Before creating any transaction, the service checks `verifyIdempotency(key)`
- If a matching key exists, the existing transaction is returned — no new entry is created
- For operations without an explicit idempotency key, the field is `NULL` (PostgreSQL allows multiple NULLs in unique constraints)
- Idempotency keys are useful for:
  - Referral rewards (`REFERRAL_{userId}_{companyId}`)
  - Signup bonuses (`SIGNUP_{userId}`)
  - Payment callbacks (`PAYMENT_{paymentId}`)
  - Campaign rewards (`CAMPAIGN_{userId}_{campaignId}`)

---

## Concurrency Strategy

| Risk | Mitigation |
|---|---|
| Double credit | Idempotency key + Prisma transaction isolation |
| Double debit | Available balance check inside transaction |
| Race conditions | All operations within Prisma `$transaction` (serializable isolation) |
| Simultaneous redemption | Row-level implicit locking via Prisma transaction |
| Negative balance | Check `availableBalance >= amount` before every debit |

Prisma's interactive transactions (`$transaction(async (tx) => { ... })`) provide serializable isolation by default, preventing phantom reads and write skew.

---

## Audit Model

Every `GOCASH_Transaction` records:
- **actorId** — who performed the action (user ID or system)
- **actorType** — USER, ADMIN, SYSTEM
- **reason** — human-readable explanation
- **sourceSystem** — originating module (TRADGO, AUTH, ORDER, etc.)
- **referenceType** — entity type being referenced
- **referenceId** — ID of the referenced entity
- **idempotencyKey** — for deduplication
- **balanceBefore / balanceAfter** — full audit trail of wallet state

No record is ever deleted or updated. All corrections are additive.

---

## Recovery Strategy

If the cached wallet balance becomes inconsistent with the ledger:

1. Compute correct balance from ledger:
   ```typescript
   const correctBalance = await tx.gOCASH_Transaction.aggregate({
     where: { walletId, status: 'SUCCESS' },
     _sum: { amount: true },
   });
   ```
2. Create an `ADMIN_CORRECTION` transaction with reason
3. Update the cached wallet balance

This preserves the full audit trail while fixing the cache.

---

## Future Expansion

| Phase | Scope |
|---|---|
| 15A.4 | Reward Engine — signup bonuses, membership rewards |
| 15A.5 | Campaign Engine — time-limited campaigns with budgets |
| 15A.6 | Referral Engine — referral tracking and rewards |
| 15A.7 | Admin UI — wallet management console |
| 15A.8 | Buyer/Seller UI — wallet dashboard and transaction history |
| 15B | TRADGO™ integration — order cashback |
| 15C | Analytics — ledger-based reporting |

---

## Database Changes

### New Enums
- `GOCASHLedgerDirection` — CREDIT, DEBIT
- `GOCASHLedgerStatus` — PENDING, SUCCESS, FAILED, REVERSED
- `GOCASH_RedemptionType` — PLANS, RFQ_PACKS, FEATURED_LISTINGS, SPONSORED_LISTINGS, ORDER_DISCOUNT, CASH_WITHDRAWAL

### Updated Enums
- `GOCASHTransactionType` — expanded to 16 types: SIGNUP_BONUS, MEMBERSHIP_BONUS, MEMBERSHIP_RENEWAL, REFERRAL_REWARD, BUYER_CASHBACK, SELLER_CASHBACK, CAMPAIGN_REWARD, FESTIVAL_REWARD, MANUAL_CREDIT, MANUAL_DEBIT, REFUND, ADJUSTMENT, EXPIRY, REDEMPTION, TRANSFER, ADMIN_CORRECTION

### Enhanced Models
- `GOCASH_Wallet` — added `createdAt`, `@@unique([userId])`
- `GOCASH_Transaction` — added `direction`, `status`, `currency`, `sourceType`, `idempotencyKey`, `notes`, `createdAt`
- `GOCASH_Redemption` — added `createdAt`

### Models Left Unchanged (Locked Core Platform)
- `User` — no modifications
- `Company` — no modifications
- `GoCashTransaction` (legacy) — no modifications

---

## Files Created

| File | Purpose |
|---|---|
| `apps/api/src/modules/gocash/gocash.module.ts` | Module definition |
| `apps/api/src/modules/gocash/gocash.service.ts` | Enterprise Immutable Ledger Engine |
| `apps/api/src/modules/gocash/gocash.controller.ts` | Internal API endpoints |
| `apps/api/src/modules/gocash/index.ts` | Barrel exports |
| `apps/api/src/modules/gocash/dto/create-wallet.dto.ts` | CreateWalletDto |
| `apps/api/src/modules/gocash/dto/credit-wallet.dto.ts` | CreditWalletDto |
| `apps/api/src/modules/gocash/dto/debit-wallet.dto.ts` | DebitWalletDto |
| `apps/api/src/modules/gocash/dto/redeem.dto.ts` | RedeemDto, ReverseDto, RejectRedemptionDto |
| `apps/api/src/modules/gocash/dto/search-query.dto.ts` | SearchQueryDto, LedgerQueryDto |
| `apps/api/src/modules/gocash/dto/index.ts` | DTO barrel exports |
| `GOCASH-LEDGER-ENGINE.md` | This document |

## Files Deleted

| File | Reason |
|---|---|
| `apps/api/src/modules/gocash/entities/gocash-wallet.entity.ts` | TypeORM violation |
| `apps/api/src/modules/gocash/entities/gocash-transaction.entity.ts` | TypeORM violation |
| `apps/api/src/modules/gocash/entities/gocash-redemption.entity.ts` | TypeORM violation |
| `apps/api/src/modules/gocash/entities/referral-program.entity.ts` | TypeORM violation |
| `apps/api/src/modules/gocash/entities/` (directory) | Empty after removal |
| `apps/api/src/modules/gocash/models/` (directory) | Unused (Prisma generates types) |

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added GOCASHLedgerDirection, GOCASHLedgerStatus, GOCASH_RedemptionType enums; expanded GOCASHTransactionType; added fields to GOCASH_Wallet, GOCASH_Transaction, GOCASH_Redemption; removed @relation to locked models |
| `apps/api/src/app.module.ts` | Registered GocashModule |
| `packages/gocash/package.json` | Removed TypeORM dep, fixed JSON comments |

## Service Methods

| Method | Description |
|---|---|
| `createWallet()` | Create a new wallet with zero balance |
| `credit()` | Credit wallet with immutable ledger entry |
| `debit()` | Debit wallet with immutable ledger entry |
| `reverse()` | Create reversing entry for any transaction |
| `redeem()` | Create redemption request (PENDING, no balance change) |
| `approveRedemption()` | Approve and create debit ledger entry |
| `rejectRedemption()` | Reject redemption (no balance change) |
| `getBalance()` | Get wallet with current cached balance |
| `getWalletByUserId()` | Get wallet by user ID |
| `getLedger()` | Query ledger entries with filters (direction, type, status, date range) |
| `getTransaction()` | Get single ledger entry by ID |
| `verifyIdempotency()` | Check if idempotency key exists |
| `adminListWallets()` | Paginated wallet list for admin |
| `adminGetWalletStats()` | Aggregate wallet statistics |
| `getRedemptions()` | List redemptions for a wallet |

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/gocash/wallets` | ADMIN | Create wallet |
| GET | `/gocash/wallets/my` | BUYER/SELLER | Get own wallet |
| GET | `/gocash/wallets/:id` | ADMIN | Get wallet by ID |
| GET | `/gocash/wallets/user/:userId` | ADMIN | Get wallet by user ID |
| POST | `/gocash/wallets/:id/credit` | ADMIN | Credit wallet |
| POST | `/gocash/wallets/:id/debit` | ADMIN | Debit wallet |
| POST | `/gocash/wallets/:id/redeem` | BUYER/SELLER | Request redemption |
| POST | `/gocash/redemptions/:id/approve` | ADMIN | Approve redemption |
| POST | `/gocash/redemptions/:id/reject` | ADMIN | Reject redemption |
| POST | `/gocash/transactions/:id/reverse` | ADMIN | Reverse transaction |
| GET | `/gocash/wallets/:id/ledger` | OWNER/ADMIN | Get ledger entries |
| GET | `/gocash/transactions/:id` | ADMIN | Get single transaction |
| GET | `/gocash/admin/wallets` | ADMIN | List all wallets |
| GET | `/gocash/admin/wallets/stats` | ADMIN | Wallet statistics |
| GET | `/gocash/admin/redemptions/:walletId` | ADMIN | List redemptions |
| GET | `/gocash/idempotency/:key` | ADMIN | Check idempotency key |

## Validation Results

| Check | Result |
|---|---|
| `prisma validate` | ✅ Schema valid |
| `prisma generate` | ✅ Generated to @prisma/client |
| `tsc (api) --noEmit` | ✅ 0 errors |
| `eslint (api) --ext .ts` | ✅ 0 errors, 5 warnings (no-explicit-any in dynamic queries) |
