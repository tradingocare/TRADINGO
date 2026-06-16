-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TemplateFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'PRICE', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'DATE', 'URL', 'PHONE', 'FILE', 'IMAGE', 'VIDEO', 'PDF', 'LOCATION', 'RICH_TEXT', 'TAGS', 'JSON');

-- CreateTable
CREATE TABLE "CategoryTemplate" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateField" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "TemplateFieldType" NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "defaultValue" JSONB,
    "options" JSONB,
    "unit" TEXT,
    "validation" JSONB,
    "visibility" JSONB,
    "metadata" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryTemplate_categoryId_idx" ON "CategoryTemplate"("categoryId");
CREATE INDEX "CategoryTemplate_status_idx" ON "CategoryTemplate"("status");
CREATE UNIQUE INDEX "CategoryTemplate_categoryId_version_key" ON "CategoryTemplate"("categoryId", "version");
CREATE INDEX "TemplateSection_templateId_idx" ON "TemplateSection"("templateId");
CREATE UNIQUE INDEX "TemplateSection_templateId_key_key" ON "TemplateSection"("templateId", "key");
CREATE INDEX "TemplateField_sectionId_idx" ON "TemplateField"("sectionId");
CREATE INDEX "TemplateField_key_idx" ON "TemplateField"("key");
CREATE UNIQUE INDEX "TemplateField_sectionId_key_key" ON "TemplateField"("sectionId", "key");
CREATE INDEX "ProductAttribute_productId_idx" ON "ProductAttribute"("productId");
CREATE INDEX "ProductAttribute_fieldId_idx" ON "ProductAttribute"("fieldId");
CREATE UNIQUE INDEX "ProductAttribute_productId_fieldId_key" ON "ProductAttribute"("productId", "fieldId");
CREATE UNIQUE INDEX "ProductAttribute_productId_fieldKey_key" ON "ProductAttribute"("productId", "fieldKey");

-- AddForeignKey
ALTER TABLE "CategoryTemplate" ADD CONSTRAINT "CategoryTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateSection" ADD CONSTRAINT "TemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CategoryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TemplateSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "TemplateField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
