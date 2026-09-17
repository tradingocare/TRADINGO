-- CreateEnum
CREATE TYPE "CompanyStructure" AS ENUM ('SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'LLP', 'PUBLIC_LIMITED', 'HUF', 'TRUST', 'OTHER');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companyStructure" "CompanyStructure";