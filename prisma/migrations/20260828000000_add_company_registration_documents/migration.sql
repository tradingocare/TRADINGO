-- Add registrationDocuments column to Company table
ALTER TABLE "Company" ADD COLUMN "registrationDocuments" JSONB NOT NULL DEFAULT '{}';
