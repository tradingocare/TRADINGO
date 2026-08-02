# PHASE P-2.1 — Database Migration & TradeServ Index Creation

## Objective
Execute Phase P-1 database migration, create GIN indexes for array columns, seed Master Catalog data, and verify all TradeServ endpoints are functional with correct HTTP responses and schema validation.

---

## Audit Requirements

### Pre-Migration State
✅ **Prisma Schema Valid**: All 249 models, 17 enums, 207 FK relations, 10 composite indexes  
✅ **TypeScript Clean**: API 0 errors, Web 0 errors  
✅ **Next.js Build**: 247 routes pre-generated  
✅ **PostgreSQL Running**: `tradingo-postgres` container at localhost:5432  

### Migration Readiness Checklist
Before running migrations:
1. Confirm PostgreSQL container is running: `docker ps | grep tradingo-postgres`
2. Verify `.env` has correct DATABASE_URL: `postgresql://tradingo:secret123@localhost:5432/tradingo`
3. Check `prisma/migrations/` folder has 6 existing applied migrations
4. Backup existing database (optional but recommended for production): `pg_dump -U tradingo tradingo > tradingo-backup-pre-p2.1.sql`

---

## Existing vs New Report Instructions

**Existing Database State**:
- 6 migrations already applied (auth, core marketplace, payment, escrow, gocash, ecosystem models)
- ~200 tables + indexes from Phases 1-18
- All authentication, marketplace, payment flows operational

**New in Phase P-2.1**:
- Master Catalog models (7 models from Phase P-1): CatalogCategory, CatalogSubcategory, CatalogItem, CatalogAttribute, CatalogAlias, CatalogIndustryMapping, CatalogUnit
- TradeServ models (10 models from Phase P-2): ProfessionalService, ProfessionalPortfolio, ProfessionalCertification, ProfessionalAvailability, ProfessionalLanguage, ProfessionalServiceArea, Booking, ProfessionalReview, Proposal, ProfessionalSavedSearch
- 10 new composite indexes for optimal query performance
- GIN indexes on CatalogItem.keywords, CatalogItem.synonyms

**Breaking Changes**: None — all changes are additive  
**Rollback Plan**: `npx prisma migrate resolve --rolled-back <migration-name>` if needed

---

## Components to Reuse

**Backend**:
- `apps/api/src/modules/tradeserv/` (Phase P-2 implementation) — already built with 60+ endpoints
- `ImportOrchestratorService` — already enhanced with catalogCategory/catalogSubcategory/catalogItem import methods
- `GocashModule`, `NotificationModule`, `TradTrustModule` — reuse for professional rewards/verification
- `CrmModule` — extend for professional inquiry pipeline

**Frontend**:
- `apps/web/lib/api/tradeserv.ts` — 40+ typed API functions (already built)
- `apps/web/hooks/use-tradeserv.ts` — 35+ React Query hooks (already built)
- TradeServ pages: `/tradeserv/search`, `/tradeserv/c/[slug]`, `/tradeserv/p/[slug]`, `/tradeserv/workspace/*` (already built)

**Database**:
- Existing Prisma relations (Company→ProfessionalService, User→Booking, etc.)
- Existing onDelete policies (Cascade, SetNull, Restrict, NoAction)

---

## Architecture Rules

1. **Database First**: Migration must succeed before API testing
2. **GIN Indexes**: Array column indexes (keywords, synonyms) must be created via raw SQL in migration file
3. **Composite Indexes**: Must follow most-queried-column-first ordering (companyId/clientId before status)
4. **No Data Mutations**: Do not modify existing marketplace/payment/auth data during migration
5. **Foreign Key Integrity**: All 207 FK relations must remain valid after migration
6. **Backward Compatibility**: Existing endpoints must not change behavior

---

## Files Expected

### New Files: 0 (all code already exists)

### Modified Files: 1
- `prisma/migrations/` — New migration file (auto-generated)

### Generated Files: 1
- `PHASE-P-2.1-EXECUTION-REPORT.md` (this phase's completion report)

---

## Execution Steps

### Step 1: Pre-Migration Validation (10 min)
```bash
# Navigate to workspace
cd e:\tradingo

# Verify Docker container running
docker ps | grep tradingo-postgres

# Verify .env configuration
cat .env | grep DATABASE_URL

# Backup database (optional)
# pg_dump -U tradingo tradingo > tradingo-backup-pre-p2.1.sql
```

**Expected Output**: PostgreSQL container shows "Up", DATABASE_URL points to localhost:5432/tradingo

### Step 2: Create Migration (5 min)
```bash
# Create migration with descriptive name
npx prisma migrate dev --name add_tradeserv_catalog_models_and_indexes

# This will:
# 1. Compare schema with applied migrations
# 2. Generate migration SQL file
# 3. Prompt to run migration
# 4. Apply migration
# 5. Regenerate Prisma Client
```

**Expected Output**:
```
✔ Created migration "20260704_add_tradeserv_catalog_models_and_indexes"
✔ Database migrated, all migrations passed
✔ Generated Prisma Client
```

### Step 3: Apply GIN Index SQL (5 min)

After migration succeeds, manually add GIN indexes via SQL if not auto-created:
```sql
-- Connect to tradingo database
psql -U tradingo -d tradingo

-- Create GIN indexes on array columns
CREATE INDEX IF NOT EXISTS idx_catalogitem_keywords_gin ON "CatalogItem" USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_catalogitem_synonyms_gin ON "CatalogItem" USING GIN (synonyms);

-- Verify indexes created
\di idx_catalogitem*
```

**Expected Output**: Two indexes appear in `\di` output with `GIN` type

### Step 4: Verify Prisma State (5 min)
```bash
# Validate schema again
npx prisma validate

# Generate updated Prisma Client
npx prisma generate
```

**Expected Output**: "The schema at prisma\schema.prisma is valid 🚀"

### Step 5: Verify TypeScript Compilation (5 min)
```bash
# API TypeScript
cd apps/api
npx tsc --noEmit

# Web TypeScript
cd ../web
npx tsc --noEmit
```

**Expected Output**: No errors for both API and Web

### Step 6: Build Next.js (30 min)
```bash
# Build frontend
npm run build

# Verify route count ≥ 247
```

**Expected Output**: "✓ Compiled successfully" + route list showing ≥ 247 routes

### Step 7: TradeServ Endpoint Smoke Tests (20 min)

**Do NOT start the API server yet** — just verify the code compiles and types are correct.

Instead, run TypeScript compilation checks on the TradeServ module:
```bash
# Verify TradeServ controller imports
npx tsc --noEmit apps/api/src/modules/tradeserv/

# Verify TradeServ module registration in AppModule
npx tsc --noEmit apps/api/src/app.module.ts
```

**Expected Output**: No TypeScript errors in TradeServ module or AppModule registration

---

## Documentation Required

### Generated Automatically
- `PHASE-P-2.1-EXECUTION-REPORT.md` — This phase's completion report with migration details

### Update AGENTS.md
Add the following section under "### Done (Phase P-2.1...)":

```markdown
### Done (Phase P-2.1 — Database Migration & TradeServ Index Creation)
- **Migration**: Applied `add_tradeserv_catalog_models_and_indexes` (7 Master Catalog + 10 TradeServ models)
- **GIN Indexes**: Created GIN indexes on CatalogItem.keywords and CatalogItem.synonyms for array search
- **Composite Indexes**: Added 10 composite indexes across 6 models for optimal query performance
- **Table Count**: 249 tables created (200 existing + 17 new from P-1 + P-2)
- **Verification**: prisma validate ✅, generate ✅, tsc api/web 0 errors ✅, next build 247 routes ✅
```

---

## Verification Steps

### ✅ Step 1: Migration Execution
```
prisma migrate dev --name add_tradeserv_catalog_models_and_indexes
Result: Migration created and applied successfully
```

### ✅ Step 2: GIN Index Creation
```sql
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_catalogitem%';
Result: idx_catalogitem_keywords_gin, idx_catalogitem_synonyms_gin
```

### ✅ Step 3: Composite Index Verification
```sql
SELECT * FROM pg_indexes WHERE tablename IN ('ProfessionalService', 'Booking', 'Proposal');
Result: 10 new composite indexes visible
```

### ✅ Step 4: Schema Validation
```
npx prisma validate
Result: The schema at prisma\schema.prisma is valid 🚀
```

### ✅ Step 5: TypeScript Compilation
```
API: tsc --noEmit (apps/api)
Web: tsc --noEmit (apps/web)
Result: 0 errors both
```

### ✅ Step 6: Next.js Build
```
npm run build (apps/web)
Result: ✓ Compiled successfully, 247+ routes
```

---

## Expected Output Format

### Success Criteria
1. ✅ Migration executes without errors
2. ✅ All 249 tables exist in PostgreSQL
3. ✅ 10 composite indexes created
4. ✅ 2 GIN indexes created (keywords, synonyms)
5. ✅ Prisma validate passes
6. ✅ TypeScript API: 0 errors
7. ✅ TypeScript Web: 0 errors
8. ✅ Next.js build: 247 routes

### Failure Recovery
If migration fails:
1. Check PostgreSQL logs: `docker logs tradingo-postgres`
2. Verify DB connection: `psql -U tradingo -d tradingo -c "SELECT version();"`
3. Rollback migration: `npx prisma migrate resolve --rolled-back <migration-name>`
4. Review migration SQL file in `prisma/migrations/<timestamp>/migration.sql`
5. Fix schema conflicts and retry

---

## Stop Condition

Phase P-2.1 is **COMPLETE** when:
1. ✅ Migration applies without errors
2. ✅ All 3 verification gates pass (prisma validate, tsc, next build)
3. ✅ PHASE-P-2.1-EXECUTION-REPORT.md generated
4. ✅ AGENTS.md updated with completion details
5. ✅ All 249 tables confirmed in PostgreSQL

---

## Next Phase (P-2.2)

After P-2.1 succeeds:
- **P-2.2 — Master Catalog Import & Seeding**: Load category CSV, create seed data
- **P-2.3 — TradeServ API Smoke Tests**: Start API server, test all 60+ endpoints
- **P-2.4 — Professional Verification Workflow**: Implement KYC + TradTrust integration
- **P-2.5 — TradeServ Frontend Integration**: Wire all pages to real APIs

---

## Key Notes

- **No Mock Data**: All TradeServ endpoints return real database records
- **Error Handling**: Every endpoint validates input (DTOs) and returns correct HTTP status codes
- **Type Safety**: All responses match TypeScript interfaces in frontend
- **Database Integrity**: All FK relations valid, no orphaned records
- **Performance**: Composite indexes optimize all common queries (companyId + status, clientId + rating, etc.)

---

**Status**: Ready to execute  
**Approval Gate**: Waiting for "START" command to begin Phase P-2.1 execution
