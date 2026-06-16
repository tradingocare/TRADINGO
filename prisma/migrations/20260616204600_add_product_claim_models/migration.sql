-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "productMasterId" TEXT;

-- CreateTable
CREATE TABLE "ProductAttachment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT,
    "productId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductClaim" (
    "id" TEXT NOT NULL,
    "productMasterId" TEXT,
    "companyId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "unit" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "moq" INTEGER,
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "productId" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAttachment_claimId_idx" ON "ProductAttachment"("claimId");

-- CreateIndex
CREATE INDEX "ProductAttachment_productId_idx" ON "ProductAttachment"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductClaim_productId_key" ON "ProductClaim"("productId");

-- CreateIndex
CREATE INDEX "ProductClaim_companyId_idx" ON "ProductClaim"("companyId");

-- CreateIndex
CREATE INDEX "ProductClaim_productMasterId_idx" ON "ProductClaim"("productMasterId");

-- CreateIndex
CREATE INDEX "ProductClaim_status_idx" ON "ProductClaim"("status");

-- CreateIndex
CREATE INDEX "ProductClaim_companyId_status_idx" ON "ProductClaim"("companyId", "status");

-- CreateIndex
CREATE INDEX "Product_productMasterId_idx" ON "Product"("productMasterId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "ProductMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttachment" ADD CONSTRAINT "ProductAttachment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ProductClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttachment" ADD CONSTRAINT "ProductAttachment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductClaim" ADD CONSTRAINT "ProductClaim_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "ProductMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductClaim" ADD CONSTRAINT "ProductClaim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductClaim" ADD CONSTRAINT "ProductClaim_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
