-- Release drift catch-up (consolidated, verified 2026-10-09).
-- Provenance: `prisma migrate diff` of the exact e77f6d9 release tree
-- (6 tracked migrations) against its fresh-DB state on disposable PG16.
-- The diff proves these objects are in schema.prisma but absent from the
-- release migration chain. SQL below reuses the verified untracked sources
-- byte-for-byte where they match the diff:
--   0911 SellerRegistrationForm (RegistrationFormStatus + table + 4 idx + 3 FK)
--   0930 LegacyCategoryCatalogMapping (CategoryMappingRelation + table + idx + FK)
--   1002 AiUsage scoped idempotency (drop global unique, add scoped unique + idx)
-- plus the Company.registrationDocuments nullability relaxation.
-- Guards (IF NOT EXISTS / pg_catalog checks) make this safe to apply on a
-- database that already has any subset (e.g. production already carries
-- 0909+0911+0914 per the 2026-09-23 preservation manifest).
-- Explicitly NOT included (no duplication, no history rewrite):
--   PlanVersion table + Company/Invoice/PlanHistory columns (in 0909 tracked)
--   Product/ProductDraft taxonomy triple (in 0912 tracked; production 0914 equiv)
--   ProfessionalService triple (in 0912 tracked; 0914 deliberately excluded it)
--   CatalogIndustryMapping / IndustryCategoryMapping (in initial migration)
--   CatalogItem.catalogCategoryId (absent from BOTH schema and migrations;
--     intentionally untouched -- never created, never dropped, never renamed)
--   September 13 draft migration 20260913000000 (EXACT ORIGINAL SQL = RECOVERED,
--     sha256 74C87ED3...777796 byte-identical to preservation bundle, but
--     SUPERSEDED by production 0914 resolved migration whose header states
--     0912+0913 were never applied anywhere -- do NOT apply 0913).

-- CreateEnum RegistrationFormStatus (guarded: production may already have it via 0911).
DO $$ BEGIN
  CREATE TYPE "RegistrationFormStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum CategoryMappingRelation (guarded: production may already have it via 0930).
DO $$ BEGIN
  CREATE TYPE "CategoryMappingRelation" AS ENUM ('EXACT', 'RELATED', 'ONE_TO_MANY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: Company.registrationDocuments becomes nullable without default.
-- (schema.prisma: Json? vs 0828 migration: JSONB NOT NULL DEFAULT '{}').
-- Re-running on an already-nullable column is a safe no-op in PostgreSQL.
ALTER TABLE "Company" ALTER COLUMN "registrationDocuments" DROP NOT NULL,
ALTER COLUMN "registrationDocuments" DROP DEFAULT;

-- CreateTable SellerRegistrationForm (exact 0911 definition, guarded).
CREATE TABLE IF NOT EXISTS "SellerRegistrationForm" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "selectedPlanId" TEXT,
    "selectedPlanVersionId" TEXT,
    "status" "RegistrationFormStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "draftPayload" JSONB NOT NULL DEFAULT '{}',
    "payloadVersion" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerRegistrationForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable LegacyCategoryCatalogMapping (exact 0930 definition, guarded).
CREATE TABLE IF NOT EXISTS "LegacyCategoryCatalogMapping" (
    "id" TEXT NOT NULL,
    "legacyCategoryId" TEXT NOT NULL,
    "catalogCategoryId" TEXT NOT NULL,
    "relationType" "CategoryMappingRelation" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyCategoryCatalogMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex SellerRegistrationForm (exact 0911 names, guarded).
CREATE UNIQUE INDEX IF NOT EXISTS "SellerRegistrationForm_formId_key" ON "SellerRegistrationForm"("formId");
CREATE INDEX IF NOT EXISTS "SellerRegistrationForm_userId_status_idx" ON "SellerRegistrationForm"("userId", "status");
CREATE INDEX IF NOT EXISTS "SellerRegistrationForm_status_idx" ON "SellerRegistrationForm"("status");
CREATE INDEX IF NOT EXISTS "SellerRegistrationForm_companyId_idx" ON "SellerRegistrationForm"("companyId");

-- RenameIndex (guarded, runs BEFORE creation): if the over-long unique index
-- was stored under the full name (or the no-suffix variant) by an earlier
-- apply, canonicalize it to Prisma's truncated form first, so the guarded
-- CREATE UNIQUE below becomes a no-op instead of a second duplicate index.
-- Skipped silently when already canonical.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'LegacyCategoryCatalogMapping_legacyCategoryId_catalogCategoryId_key')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'LegacyCategoryCatalogMapping_legacyCategoryId_catalogCatego_key') THEN
    ALTER INDEX "LegacyCategoryCatalogMapping_legacyCategoryId_catalogCategoryId_key" RENAME TO "LegacyCategoryCatalogMapping_legacyCategoryId_catalogCatego_key";
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'LegacyCategoryCatalogMapping_legacyCategoryId_catalogCategoryId')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'LegacyCategoryCatalogMapping_legacyCategoryId_catalogCatego_key') THEN
    ALTER INDEX "LegacyCategoryCatalogMapping_legacyCategoryId_catalogCategoryId" RENAME TO "LegacyCategoryCatalogMapping_legacyCategoryId_catalogCatego_key";
  END IF;
END $$;

-- CreateIndex LegacyCategoryCatalogMapping (Prisma-canonical truncated unique name, guarded).
-- The 0930 source uses the full 70-char unique name; PostgreSQL truncates at
-- 63 bytes at creation and Prisma diff canonicalizes to the truncated form.
CREATE INDEX IF NOT EXISTS "LegacyCategoryCatalogMapping_legacyCategoryId_idx" ON "LegacyCategoryCatalogMapping"("legacyCategoryId");
CREATE INDEX IF NOT EXISTS "LegacyCategoryCatalogMapping_catalogCategoryId_idx" ON "LegacyCategoryCatalogMapping"("catalogCategoryId");
CREATE INDEX IF NOT EXISTS "LegacyCategoryCatalogMapping_isActive_idx" ON "LegacyCategoryCatalogMapping"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "LegacyCategoryCatalogMapping_legacyCategoryId_catalogCatego_key" ON "LegacyCategoryCatalogMapping"("legacyCategoryId", "catalogCategoryId");

-- AiUsage scoped idempotency (exact 1002 swap, guarded).
DROP INDEX IF EXISTS "AiUsage_idempotencyKey_key";
CREATE UNIQUE INDEX IF NOT EXISTS "AiUsage_companyId_idempotencyKey_key" ON "AiUsage"("companyId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "AiUsage_idempotencyKey_idx" ON "AiUsage"("idempotencyKey");

-- AddForeignKey SellerRegistrationForm (exact 0911 constraints, guarded).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerRegistrationForm_userId_fkey') THEN
    ALTER TABLE "SellerRegistrationForm" ADD CONSTRAINT "SellerRegistrationForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerRegistrationForm_companyId_fkey') THEN
    ALTER TABLE "SellerRegistrationForm" ADD CONSTRAINT "SellerRegistrationForm_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SellerRegistrationForm_selectedPlanVersionId_fkey') THEN
    ALTER TABLE "SellerRegistrationForm" ADD CONSTRAINT "SellerRegistrationForm_selectedPlanVersionId_fkey" FOREIGN KEY ("selectedPlanVersionId") REFERENCES "MembershipPlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey LegacyCategoryCatalogMapping (exact 0930 constraints, guarded).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LegacyCategoryCatalogMapping_legacyCategoryId_fkey') THEN
    ALTER TABLE "LegacyCategoryCatalogMapping" ADD CONSTRAINT "LegacyCategoryCatalogMapping_legacyCategoryId_fkey" FOREIGN KEY ("legacyCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LegacyCategoryCatalogMapping_catalogCategoryId_fkey') THEN
    ALTER TABLE "LegacyCategoryCatalogMapping" ADD CONSTRAINT "LegacyCategoryCatalogMapping_catalogCategoryId_fkey" FOREIGN KEY ("catalogCategoryId") REFERENCES "CatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
