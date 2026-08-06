# Legacy Referral Migration Sequence

## Background

Three referral systems exist in the codebase:

| System | Module | Status | Tables | Notes |
|--------|--------|--------|--------|-------|
| **A — Legacy** | `MembershipModule` | Decorative | `Referral` (prisma) | `validateReferral()` reads, never rewards |
| **B — Dead** | `ReferralProgram` | Dead | None | Superseded by System C, no code path |
| **C — Enterprise** | `ReferralModule` | Active | `ReferralCode`, `ReferralUsage`, `ReferralReward`, `ReferralAudit`, `ReferralBlacklist` | Full GOCASH integration, fraud detection |

## Migration Sequence

```
Phase I: Read Only (CURRENT)
Phase II: Migration Script
Phase III: Production Verification
Phase IV: Archive
Phase V: Removal
```

### Phase I — Read Only (Now)

- **System A** (`membership.service.ts`): `validateReferral()` method continues to read from the `Referral` table
- **System C** (`referral.service.ts`): All new referral operations use the Enterprise tables
- **Status**: No data loss. System A is already read-only (never writes to `Referral`).

### Phase II — Migration Script

```sql
-- scripts/migrate-legacy-referrals.sql
-- Run after Sprint 2 completes and all referral UIs are live

-- Step 1: Create ReferralCode entries for legacy Referral records
INSERT INTO "ReferralCode" (id, code, "userId", type, status, "currentUsage", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  'LEGACY-' || SUBSTRING(MD5(r.id::text) FOR 8),
  r."referrerId",
  'GENERAL'::"ReferralCodeType",
  'ACTIVE'::"ReferralCodeStatus",
  r."usageCount",
  r."createdAt",
  NOW()
FROM "Referral" r
WHERE NOT EXISTS (
  SELECT 1 FROM "ReferralCode" rc 
  WHERE rc."userId" = r."referrerId" 
    AND rc.code LIKE 'LEGACY-%'
);

-- Step 2: Create ReferralUsage entries from legacy referrer_earnings if any
-- (Schema-dependent, verify Referral model fields first)
```

### Phase III — Production Verification

1. Verify all legacy codes resolve via `GET /referrals/codes/:code`
2. Verify legacy referral history shows in user statistics
3. Verify admin dashboard counts match across both systems
4. Run for 1 production week with both systems active

### Phase IV — Archive

```sql
-- Rename legacy table for 30-day quarantine
ALTER TABLE "Referral" RENAME TO "_Referral_legacy_archived";
-- Update Prisma schema to remove model
```

### Phase V — Removal

- Remove `Referral` model from `prisma/schema.prisma`
- Remove `validateReferral()` from `membership.service.ts`
- Run `prisma migrate dev --name remove_legacy_referral`
- Drop `_Referral_legacy_archived` table after 30 days

## Rollback

- **Phase I → II**: Rollback = stop migration script. System A still readable.
- **Phase II → III**: Rollback = re-run migration with `ON CONFLICT DO NOTHING`. 
- **Phase IV → V**: Rollback = restore table from rename.
- **Phase V**: Rollback = restore table from backup.

## Verification Queries

```sql
-- Check if any legacy referrers are missing from Enterprise system
SELECT r."referrerId" 
FROM "Referral" r 
LEFT JOIN "ReferralCode" rc ON rc."userId" = r."referrerId" AND rc.code LIKE 'LEGACY-%'
WHERE rc.id IS NULL;

-- Check total counts match
SELECT 'Legacy' as system, COUNT(*) FROM "Referral"
UNION ALL
SELECT 'Enterprise' as system, COUNT(*) FROM "ReferralCode";
```

## Schedule

- **Phase I**: Sprint 2 complete
- **Phase II**: Sprint 3 (week 1)
- **Phase III**: Sprint 3 (weeks 2-3)
- **Phase IV**: Sprint 4
- **Phase V**: Sprint 5 (after 30-day quarantine)
