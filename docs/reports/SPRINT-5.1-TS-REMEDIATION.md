# Sprint 5.1 — TypeScript Remediation & Node 24 Docker Upgrade

## Objective
Eliminate all TypeScript errors in the `@tradingo/api` build (target: `tsc` → 0 errors), then upgrade `apps/api` and `apps/web` Dockerfiles to `node:24-alpine`, and verify the full build chain. No business-logic, API, or schema changes.

## Result Summary

| Verification Step | Result |
|---|---|
| `tsc -p tsconfig.build.json --noEmit` (api) | ✅ **0 errors** |
| `nest build` (api) | ✅ PASS |
| API Docker build (`node:24-alpine`) | ✅ PASS |
| Web Docker build (`node:24-alpine`) | ✅ PASS |
| `docker scout` base images | ✅ CLEAN (2 LOW each) |
| `next build` (web) | ✅ PASS (293 static pages) |

## 1. TypeScript Error Remediation (92 → 0)

### Baseline
- **Original debt**: 92 errors across `@tradingo/api` (log: `ts-debt-full.txt`).
- Prior sessions reduced this to 42 (Group A: AI DTO-typed payloads + `typeof` narrowings + removed 9 dead `leadId` spreads in `ai-crm.controller.ts`).

### Files Fixed in This Sprint (42 → 0)

**Phase 1 — Trade Match & Ecosystem**
- `apps/api/src/modules/tradmatch/tradmatch.service.ts`
  - Added `ScoredVendor` / `MatchVendor` interfaces (with `export` on `ScoredVendor` for controller typing).
  - Typed `scoreAndRankVendors`, `calculateScore`, `categoryMatchScore`, `geoMatchScore`, `findVendorsByCategory`, `expandCategory`, `expandRadius`, `broadcastMatches`.
  - Added `type Prisma` import (fixes `Cannot find namespace 'Prisma'` at line 234).
- `apps/api/src/modules/gocash-ecosystem/gocash-ecosystem.service.ts`
  - Typed `levels` const, event payload interfaces (`CheckinCompletedPayload`, `LevelUpPayload`, `BadgeEarnedPayload`, `MissionCompletedPayload`), event handlers.
  - `awardXp` metadata cast to `Prisma.InputJsonValue`; `completeMission` param typed `EcosystemMission`.
  - `processLevelRewards` signature: `Array<{ type: string; amount: number }>`; call-site cast updated.
  - Seed path uses `benefits: [] as any`, `rewards: l.rewards as any` (schema JSON fields).

**Phase 2 — Payment & Order Chain**
- `apps/api/src/modules/payment/payment.service.ts` — `notes` metadata casts (plan + booking payloads).
- `apps/api/src/modules/smart-order/smart-order.service.ts` — imported `type PurchaseOrder, type Order`; typed `notifyOrderCreation(po, order, userId)`.
- `apps/api/src/modules/smart-po/smart-po.service.ts` — `trackVersion` / `trackEvent` now use `tx: Prisma.TransactionClient`.

**Phase 3 — Dispute & Advertising**
- `apps/api/src/modules/dispute/admin.service.ts` — added `AvailableAdmin` interface; typed dispatch methods.
- `apps/api/src/modules/dispute/admin-assignment.service.ts` — added `AvailableAdmin` / `AssignedAdmin` interfaces; typed `getAvailableAdmins`, `getLeastBusyAdmin`, `getLeastBusyFromList`, `getNextRoundRobin`.
- `apps/api/src/modules/advertising/advertising.service.ts` — `dto.metadata` cast to `Prisma.InputJsonValue`.

**Phase 4 — Final 4 Errors**
- `apps/api/src/modules/tradfind/services/product-search.service.ts` — imported `UnifiedRankingScore`; `reorderByScore` input cast to `Array<Record<string, UnifiedRankingScore>>` (the callback `h._unifiedRanking` was inferred as `unknown`).
- `apps/api/src/modules/gocash-ecosystem/gocash-ecosystem.service.ts:177` — cast `nextLevel.rewards as unknown as Array<{ type: string; amount: number }>`.
- `apps/api/src/modules/ai/catalog-analytics.service.ts:61` — `Number(meta.delta) || 0`.
- `apps/api/src/modules/ai/catalog-quality.controller.ts` — **6 array-relation errors surfaced by fresh Prisma client**: `CatalogQualityScore` is a **1:1** relation (`productId @unique`) in `prisma/schema.prisma`, but the controller used array syntax. The stale local Prisma client hid these; the in-Docker `prisma generate` surfaced them. All 6 usages rewritten to singular-relation form (dropped `orderBy`/`take` on `qualityScores` select, `.qualityScores?.[0]` → `.qualityScores`, `qualityScores![0]` → `qualityScores!`).

### Verification Method
Local `npx prisma generate --schema=prisma/schema.prisma` was re-run so the local client matches the fresh client generated inside Docker (this is what surfaced the `catalog-quality.controller.ts` errors that local `tsc` had previously passed on).

## 2. Dockerfile Upgrade node:20 → node:24

- `apps/api/Dockerfile` — all 3 stages (builder, migration, runner) now `FROM node:24-alpine`.
- `apps/web/Dockerfile` — all 3 stages (deps, builder, runner) now `FROM node:24-alpine`.
- Root `package.json` `engines.node` is `>=20.0.0` — compatible with Node 24; no other dependency changes required.
- pnpm 9.15.0 (via corepack) works on Node 24; bcrypt 5.1.1 downloads a `napi-v3 linux-musl` prebuilt without issues.

## 3. Docker Scout Security Scan

| Image | Size | Vulnerabilities | Base image |
|---|---|---|---|
| `tradingo-api:ts-remediation` | 395 MB | 2 Critical / 54 High / 46 Med / 4 Low / 1 Unspecified | CLEAN (2 LOW) |
| `tradingo-web:ts-remediation` | — | 1 Critical / 11 High / 14 Med / 2 Low / 1 Unspecified | CLEAN (2 LOW) |

- `--only-base`: both base images are **clean** (only 2 LOW, Alpine patch-level). The node:24 upgrade introduces **zero new** base-image CVEs.
- Residual app-layer CVEs are **pre-existing and unrelated to this upgrade**:
  - Critical: `tar` — `6.2.1` (via `bcrypt → @mapbox/node-pre-gyp`) and `7.5.16` (bundled with `next@16.2.9` as `next/dist/compiled/tar`).
  - Not remediated here: dependency upgrades fall outside this sprint's scope (no business-logic/dependency changes allowed). Tracked as a follow-up.

## 4. Route Count

- `next build` generates **293 static pages** successfully (Next.js 16.2.9, Turbopack). TypeScript finished with 0 errors.

## Files Changed

### Created
- `docs/reports/SPRINT-5.1-TS-REMEDIATION.md` (this report)

### Modified
- `apps/api/Dockerfile` (node:20-alpine → node:24-alpine, 3 stages)
- `apps/web/Dockerfile` (node:20-alpine → node:24-alpine, 3 stages)
- `apps/api/src/modules/tradmatch/tradmatch.service.ts`
- `apps/api/src/modules/gocash-ecosystem/gocash-ecosystem.service.ts`
- `apps/api/src/modules/payment/payment.service.ts`
- `apps/api/src/modules/smart-order/smart-order.service.ts`
- `apps/api/src/modules/smart-po/smart-po.service.ts`
- `apps/api/src/modules/dispute/admin.service.ts`
- `apps/api/src/modules/dispute/admin-assignment.service.ts`
- `apps/api/src/modules/advertising/advertising.service.ts`
- `apps/api/src/modules/tradfind/services/product-search.service.ts`
- `apps/api/src/modules/ai/catalog-analytics.service.ts`
- `apps/api/src/modules/ai/catalog-quality.controller.ts`

## Follow-Up (NOT in this sprint)
- Bump `tar` in the application dependency graph (`bcrypt` chain) and track Next.js bundled `tar` once upstream ships a fixed version.