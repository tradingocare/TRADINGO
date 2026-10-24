-- P2C-R5B: canonical SellerRegistrationForm foundation (D-REG-01).
-- Additive only: one enum + one table. No existing tables altered.
-- Applied to LOCAL dev database only. Never to be auto-applied to production
-- without Founder approval.

-- CreateEnum
CREATE TYPE "RegistrationFormStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "SellerRegistrationForm" (
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

-- CreateIndex
CREATE UNIQUE INDEX "SellerRegistrationForm_formId_key" ON "SellerRegistrationForm"("formId");
CREATE INDEX "SellerRegistrationForm_userId_status_idx" ON "SellerRegistrationForm"("userId", "status");
CREATE INDEX "SellerRegistrationForm_status_idx" ON "SellerRegistrationForm"("status");
CREATE INDEX "SellerRegistrationForm_companyId_idx" ON "SellerRegistrationForm"("companyId");

-- AddForeignKey
ALTER TABLE "SellerRegistrationForm" ADD CONSTRAINT "SellerRegistrationForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerRegistrationForm" ADD CONSTRAINT "SellerRegistrationForm_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerRegistrationForm" ADD CONSTRAINT "SellerRegistrationForm_selectedPlanVersionId_fkey" FOREIGN KEY ("selectedPlanVersionId") REFERENCES "MembershipPlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
