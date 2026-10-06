-- Add MembershipPlanVersion table + nullable version references (D-1 approved: additive, null-safe, no data rewrite)
-- NOTE: pre-existing schema-vs-history drift on Company.registrationDocuments
-- (nullable in schema.prisma vs NOT NULL DEFAULT '{}' in 20260828000000) is
-- intentionally NOT bundled here; see D-1 implementation report.

-- CreateTable
CREATE TABLE "MembershipPlanVersion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PlanVisibility" NOT NULL DEFAULT 'DRAFT',
    "pricePlanA" INTEGER NOT NULL,
    "pricePlanB" INTEGER NOT NULL,
    "pricePlanC" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "badgeText" TEXT,
    "features" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlanVersion_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "currentPlanVersionId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "planVersionId" TEXT;

-- AlterTable
ALTER TABLE "PlanHistory" ADD COLUMN "planVersionId" TEXT;

-- CreateIndex
CREATE INDEX "MembershipPlanVersion_planId_idx" ON "MembershipPlanVersion"("planId");

-- CreateIndex
CREATE INDEX "MembershipPlanVersion_planId_status_idx" ON "MembershipPlanVersion"("planId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlanVersion_planId_version_key" ON "MembershipPlanVersion"("planId", "version");

-- CreateIndex
CREATE INDEX "Invoice_planVersionId_idx" ON "Invoice"("planVersionId");

-- CreateIndex
CREATE INDEX "PlanHistory_planVersionId_idx" ON "PlanHistory"("planVersionId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_currentPlanVersionId_fkey" FOREIGN KEY ("currentPlanVersionId") REFERENCES "MembershipPlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlanVersion" ADD CONSTRAINT "MembershipPlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("planId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "MembershipPlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHistory" ADD CONSTRAINT "PlanHistory_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "MembershipPlanVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
