-- C-01 P0-2: canonical taxonomy ID persistence (F-01/F-02/F-03/F-04).
-- Additive only: nullable columns + indexes on existing tables. No column
-- drops, no type changes, no data backfill. Legacy Category layer untouched.
-- Requires Founder approval before production apply (migrate deploy).

-- Product: full canonical triple (item-first, category/subcategory denormalized per RfqProductItem precedent)
ALTER TABLE "Product" ADD COLUMN "catalogCategoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN "catalogSubcategoryId" TEXT;

-- Foreign keys (Restrict preserves catalog lineage; nullable = no behavior change until populated)
ALTER TABLE "Product" ADD CONSTRAINT "Product_catalogCategoryId_fkey" FOREIGN KEY ("catalogCategoryId") REFERENCES "CatalogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_catalogSubcategoryId_fkey" FOREIGN KEY ("catalogSubcategoryId") REFERENCES "CatalogSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Product_catalogCategoryId_idx" ON "Product"("catalogCategoryId");
CREATE INDEX "Product_catalogSubcategoryId_idx" ON "Product"("catalogSubcategoryId");

-- ProfessionalService: full canonical triple (was: single nullable catalogItemId, never written)
ALTER TABLE "ProfessionalService" ADD COLUMN "catalogCategoryId" TEXT;
ALTER TABLE "ProfessionalService" ADD COLUMN "catalogSubcategoryId" TEXT;

ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_catalogCategoryId_fkey" FOREIGN KEY ("catalogCategoryId") REFERENCES "CatalogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_catalogSubcategoryId_fkey" FOREIGN KEY ("catalogSubcategoryId") REFERENCES "CatalogSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ProfessionalService_catalogCategoryId_idx" ON "ProfessionalService"("catalogCategoryId");
CREATE INDEX "ProfessionalService_catalogSubcategoryId_idx" ON "ProfessionalService"("catalogSubcategoryId");

-- ProductDraft: confirmed triple must survive create/update/auto-save/submit
-- (previously only legacy categoryId/subcategoryId persisted; subcategory was
-- dropped at submit). Plain columns + index — validated server-side.
ALTER TABLE "ProductDraft" ADD COLUMN "catalogCategoryId" TEXT;
ALTER TABLE "ProductDraft" ADD COLUMN "catalogSubcategoryId" TEXT;
ALTER TABLE "ProductDraft" ADD COLUMN "catalogItemId" TEXT;

CREATE INDEX "ProductDraft_catalogItemId_idx" ON "ProductDraft"("catalogItemId");
