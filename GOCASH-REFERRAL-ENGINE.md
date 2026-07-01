# GOCASH™ Enterprise Referral Engine

## Architecture Overview

The GOCASH Referral Engine is an independent extension module (not Core Platform) that handles
referral code generation, validation, fraud detection, and reward processing — all rewards
routed through the GOCASH Immutable Ledger Engine for auditability.

```
┌─────────────────────────────────────────────────────────────┐
│                    Referral Engine                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Referral │  │ Referral │  │ Referral │  │ Referral  │  │
│  │  Code    │  │  Usage   │  │  Reward  │  │  Audit    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │              │         │
│  ┌────┴──────────────┴──────────────┴──────────────┘         │
│  │                   Fraud Detection                          │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐  │
│  │  │Circular  │ │ Velocity │ │Disposable │ │Blacklist  │  │
│  │  │Detection │ │  Check   │ │  Email    │ │ (IP/Dev)  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └───────────┘  │
│  └───────────────────────────────────────────────────────────│
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────┐     │
│  │           GOCASH Ledger Engine (gocash.service)      │     │
│  │           credit() → immutable ledger entry           │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Module Location

- **Service**: `apps/api/src/modules/referral/referral.service.ts`
- **Controller**: `apps/api/src/modules/referral/referral.controller.ts`
- **Module**: `apps/api/src/modules/referral/referral.module.ts`
- **DTOs**: `apps/api/src/modules/referral/dto/`
- **Frontend API**: `apps/web/lib/api/referral.ts`
- **Frontend hooks**: `apps/web/hooks/use-referral.ts`

## Database Design

### Prisma Models (in `prisma/schema.prisma`)

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `ReferralCode` | code (unique), userId, type, status, rewardAmount, maxUsage, expiresAt | Referral code generation and tracking |
| `ReferralUsage` | codeId (FK→ReferralCode), refereeEmail, status, ipAddress, deviceId, source | Each referral application |
| `ReferralReward` | usageId (FK→ReferralUsage), amount, type, status, transactionId (FK→GOCASH_Transaction) | Reward payout records |
| `ReferralAudit` | usageId?, action, details, actorId | Immutable audit trail |
| `ReferralRule` | name, type, value, priority, isActive | Campaign reward rules |
| `ReferralBlacklist` | type (IP/DEVICE/EMAIL/EMAIL_DOMAIN), value, reason, expiresAt | Fraud blacklist |

### Internal Prisma Relations

| Relation | Via |
|----------|-----|
| `ReferralUsage.code → ReferralCode` | `codeId` FK |
| `ReferralUsage.rewards → ReferralReward[]` | `usageId` FK |
| `ReferralCode.usages → ReferralUsage[]` | `codeId` FK |
| `ReferralReward.usage → ReferralUsage` | `usageId` FK |

Note: `transactionId` on `ReferralReward` is a plain string FK (no Prisma @relation)
to GOCASH_Transaction, consistent with the GOCASH pattern of avoiding cross-module
Prisma relations.

### Enums

- `ReferralCodeType`: `SIGNUP`, `CHECKOUT`, `CAMPAIGN`, `MANUAL`
- `ReferralCodeStatus`: `ACTIVE`, `PAUSED`, `EXPIRED`, `DISABLED`
- `ReferralUsageStatus`: `PENDING`, `COMPLETED`, `REWARDED`, `FAILED`, `REJECTED`, `EXPIRED`
- `ReferralRewardStatus`: `PENDING`, `PAID`, `FAILED`, `CANCELLED`
- `ReferralBlacklistType`: `IP`, `DEVICE`, `EMAIL`, `EMAIL_DOMAIN`

## Referral Flow

```
1. User requests referral code
   └─> ReferralService.createReferralCode()
       └─> Generates TRAD + 10 hex chars (unique)
       └─> Creates ReferralCode record (status=ACTIVE)
       └─> Audit trail: CREATED

2. Referee enters referral code
   └─> ReferralService.validateReferral()
       └─> Checks: exists, active, not expired, not maxed out
       └─> Checks: disposable email domain
       └─> Returns { valid: boolean, reason?: string }

3. Referral is applied
   └─> ReferralService.applyReferral()
       └─> validateReferral() first
       └─> Self-referral check (referee ≠ referrer)
       └─> Duplicate email check
       └─> Blacklist check (IP, Device, Email, Domain)
       └─> Velocity check (max 3 per 10min per IP/Device)
       └─> Creates ReferralUsage (status=COMPLETED)
       └─> Increments ReferralCode.currentUsage
       └─> Audit trail: APPLIED
       └─> ReferralService.processReferralReward()

4. Reward processing
   └─> ReferralService.processReferralReward()
       └─> Finds referrer's GOCASH_Wallet
       └─> Checks existing reward (idempotency)
       └─> Calls gocashService.credit() with idempotencyKey
           └─> Creates immutable GOCASH_Transaction entry
           └─> Updates wallet balance
       └─> Creates ReferralReward record (status=PAID)
       └─> Updates ReferralUsage → status=REWARDED
       └─> Audit trail: REWARDED or FAILED
```

## Fraud Detection

### 1. Self-Referral Prevention
```typescript
if (dto.refereeUserId === referralCode.userId) {
  throw new BadRequestException('Cannot use your own referral code');
}
```

### 2. Velocity Check
Max 3 referrals per 10-minute window per IP address or device ID.

### 3. Disposable Email Block
Blocklist of known disposable email domains (mailinator.com, guerrillamail.com, etc.).

### 4. Blacklist System
- **IP**: Block specific IP addresses
- **Device**: Block specific device IDs
- **Email**: Block specific email addresses
- **Email Domain**: Block entire domains
- Each entry can have optional expiration

### 5. Duplicate Referral Check
One email can only be referred once (checks PENDING/COMPLETED/REWARDED statuses).

### 6. Administrative Fraud Alerts (`GET /referrals/admin/fraud-alerts`)
- **Self-Referral Patterns**: Scans recent usage for referrer=referee
- **Abnormal Velocity**: Groups by IP, flags those with >5 referrals in 1 hour
- **Circular Referrals**: Detects A→B→A patterns

## API Endpoints

All endpoints are under `/referrals/` prefix.

### User Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/codes/my` | User | Get active referral code (optionally by type) |
| `GET` | `/codes/my/all` | User | List all referral codes |
| `POST` | `/codes` | User | Create referral code |
| `POST` | `/validate` | None | Validate referral code |
| `POST` | `/apply` | None | Apply referral code |
| `GET` | `/history` | User | Get referral history (usages, rewards, codes) |
| `GET` | `/statistics` | User | Get referral statistics |
| `GET` | `/audit` | User | Get audit trail |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/dashboard` | Admin dashboard stats |
| `GET` | `/admin/referrals` | Paginated referral list (searchable) |
| `GET` | `/admin/fraud-alerts` | Fraud detection alerts |
| `GET` | `/admin/blacklist` | List blacklist |
| `POST` | `/admin/blacklist` | Add to blacklist |
| `DELETE` | `/admin/blacklist/:id` | Remove from blacklist |

## Reward Processing via GOCASH Ledger

All referral rewards use the GOCASH Immutable Ledger Engine for processing:

```typescript
const ledgerEntry = await this.gocashService.credit({
  walletId: referrerWallet.id,
  amount: rewardAmount,
  type: 'REFERRAL_REWARD',
  reason: `Referral reward for ${email}`,
  actorId: 'SYSTEM',
  actorType: 'SYSTEM',
  referenceId: usage.id,
  referenceType: 'REFERRAL_USAGE',
  sourceType: 'REFERRAL',
  sourceSystem: 'REFERRAL_ENGINE',
  idempotencyKey: `REFERRAL_${usage.id}_REFERRER`,
});
```

Key properties:
- **Idempotency**: `idempotencyKey` prevents double-processing
- **Immutability**: `credit()` creates an append-only ledger entry (never UPDATE/DELETE)
- **Auditability**: Every reward has a corresponding `transactionId` on `ReferralReward`
- **Consistency**: If ledger credit succeeds but reward record creation fails, the
  idempotency key ensures the next attempt will skip the credit

## Code Generation

- Format: `TRAD` + 10 hexadecimal chars = 14 chars total
  ```typescript
  const code = 'TRAD' + crypto.randomBytes(5).toString('hex').toUpperCase();
  ```
- Uniqueness enforced at database level (`@unique` on `code` field)
- Retry mechanism: up to 10 attempts to find unique code
- Example output: `TRAD1A2B3C4D5E`

## Verification

```bash
pnpm --filter @tradingo/api exec prisma validate    # ✅
pnpm --filter @tradingo/api exec prisma generate    # ✅
cd apps/api && npx tsc --noEmit                     # 0 errors ✅
cd apps/web && npx next build                       # 174 routes ✅
npx eslint apps/api/src/modules/referral --ext .ts  # 0 errors, 8 any warnings ✅
```

## Integration Points

- `GocashService` — reward credit via ledger engine
- `NotificationService` — referral events (planned)
- Frontend hooks at `apps/web/hooks/use-referral.ts`
- Frontend API at `apps/web/lib/api/referral.ts`
- Pre-existing GOCASH pages: `/buyer/gocash`, `/seller/gocash`, `/gocash`
