-- CreateEnum
CREATE TYPE "CategoryMappingRelation" AS ENUM ('EXACT', 'RELATED', 'ONE_TO_MANY');

-- CreateTable
CREATE TABLE "LegacyCategoryCatalogMapping" (
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

-- CreateIndex
CREATE UNIQUE INDEX "LegacyCategoryCatalogMapping_legacyCategoryId_catalogCategoryId_key" ON "LegacyCategoryCatalogMapping"("legacyCategoryId", "catalogCategoryId");

-- CreateIndex
CREATE INDEX "LegacyCategoryCatalogMapping_legacyCategoryId_idx" ON "LegacyCategoryCatalogMapping"("legacyCategoryId");

-- CreateIndex
CREATE INDEX "LegacyCategoryCatalogMapping_catalogCategoryId_idx" ON "LegacyCategoryCatalogMapping"("catalogCategoryId");

-- CreateIndex
CREATE INDEX "LegacyCategoryCatalogMapping_isActive_idx" ON "LegacyCategoryCatalogMapping"("isActive");

-- AddForeignKey
ALTER TABLE "LegacyCategoryCatalogMapping" ADD CONSTRAINT "LegacyCategoryCatalogMapping_legacyCategoryId_fkey" FOREIGN KEY ("legacyCategoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyCategoryCatalogMapping" ADD CONSTRAINT "LegacyCategoryCatalogMapping_catalogCategoryId_fkey" FOREIGN KEY ("catalogCategoryId") REFERENCES "CatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
