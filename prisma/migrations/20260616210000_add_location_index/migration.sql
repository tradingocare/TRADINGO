-- CreateTable
CREATE TABLE "ProductLocationIndex" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "visibilityRadius" "GeographicReach" NOT NULL,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isTradgo" BOOLEAN NOT NULL DEFAULT false,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "deliveryEta" TEXT,
    "status" "ProductStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductLocationIndex_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductLocationIndex_productId_key" ON "ProductLocationIndex"("productId");
CREATE INDEX "ProductLocationIndex_latitude_longitude_idx" ON "ProductLocationIndex"("latitude", "longitude");
CREATE INDEX "ProductLocationIndex_companyId_idx" ON "ProductLocationIndex"("companyId");
CREATE INDEX "ProductLocationIndex_categoryId_idx" ON "ProductLocationIndex"("categoryId");
CREATE INDEX "ProductLocationIndex_visibilityRadius_idx" ON "ProductLocationIndex"("visibilityRadius");
CREATE INDEX "ProductLocationIndex_status_idx" ON "ProductLocationIndex"("status");
CREATE INDEX "ProductLocationIndex_trustScore_idx" ON "ProductLocationIndex"("trustScore");
CREATE INDEX "ProductLocationIndex_isVerified_idx" ON "ProductLocationIndex"("isVerified");
CREATE INDEX "ProductLocationIndex_isTradgo_idx" ON "ProductLocationIndex"("isTradgo");
CREATE INDEX "ProductLocationIndex_price_idx" ON "ProductLocationIndex"("price");
ALTER TABLE "ProductLocationIndex" ADD CONSTRAINT "ProductLocationIndex_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductLocationIndex" ADD CONSTRAINT "ProductLocationIndex_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductLocationIndex" ADD CONSTRAINT "ProductLocationIndex_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
