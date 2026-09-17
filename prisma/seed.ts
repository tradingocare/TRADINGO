import { PrismaClient, Role, ImportRowStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { INDUSTRY_CATEGORIES } from './seed-data/categories';
import { generateSlug } from './seed-scripts/slug-generator';

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

function generateSeoTitle(name: string, type: string): string {
  if (type === 'category') {
    return `${name} - TRADINGO B2B Marketplace | Buy & Sell ${name} Online India`;
  }
  if (type === 'subcategory') {
    return `${name} - TRADINGO | Suppliers, Manufacturers & Dealers in India`;
  }
  return `${name} - TRADINGO B2B Marketplace`;
}

function generateSeoDescription(name: string, subcategoryCount: number): string {
  return `Find top ${name} suppliers, manufacturers, and exporters in India. ${subcategoryCount > 0 ? `${subcategoryCount}+ subcategories available. ` : ''}Get best prices, quality products, and trusted sellers on TRADINGO B2B marketplace.`;
}

const MIN_PASSWORD_LENGTH = 8;

function assertPassword(varName: string, required: boolean): string | undefined {
  const value = process.env[varName];
  if (value === undefined || value === '') {
    if (required) {
      throw new Error(
        `Seed aborted: required environment variable "${varName}" is missing. No data was written.`,
      );
    }
    return undefined;
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Seed aborted: environment variable "${varName}" must be at least ${MIN_PASSWORD_LENGTH} characters. No data was written.`,
    );
  }
  return value;
}

async function seedAdminUsers() {
  // Fail fast BEFORE any database write: every required credential must be
  // supplied explicitly. No fallback/default passwords exist in production path.
  const adminPassword = assertPassword('SEED_ADMIN_PASSWORD', true)!;
  const testAdminPassword = assertPassword('SEED_TEST_ADMIN_PASSWORD', true)!;
  const viewerPassword = assertPassword('SEED_VIEWER_PASSWORD', false);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tradingo.io';

  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      permissions: ['*'],
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`SUPER_ADMIN created: ${adminEmail}`);

  const testHash = await bcrypt.hash(testAdminPassword, 12);
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: testHash,
      name: 'Test Admin',
      role: Role.ADMIN,
      permissions: ['users:read', 'users:write'],
      emailVerifiedAt: new Date(),
    },
  });
  console.log('ADMIN created: test@example.com');

  if (viewerPassword) {
    const viewerHash = await bcrypt.hash(viewerPassword, 12);
    for (let i = 1; i <= 10; i++) {
      const email = `user${i}@example.com`;
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: viewerHash,
          name: `Viewer User ${i}`,
          role: Role.VIEWER,
          permissions: [],
          emailVerifiedAt: new Date(),
        },
      });
    }
    console.log('10 VIEWER users created (opt-in via SEED_VIEWER_PASSWORD)');
  } else {
    console.log('SEED_VIEWER_PASSWORD not set — skipping 10 VIEWER demo accounts');
  }
}

async function seedCategories() {
  const catJob = await prisma.importJob.create({
    data: {
      type: 'CATEGORY',
      status: 'RUNNING',
      totalRows: INDUSTRY_CATEGORIES.length,
      startedAt: new Date(),
    },
  });

  const rows: Array<{
    importJobId: string;
    rowNumber: number;
    status: ImportRowStatus;
    entityType: string;
    entityId?: string;
    rawData?: Prisma.InputJsonValue;
    errors: string[];
    warnings: string[];
  }> = [];

  let imported = 0;
  let duplicate = 0;
  let error = 0;

  for (let i = 0; i < INDUSTRY_CATEGORIES.length; i++) {
    const cat = INDUSTRY_CATEGORIES[i];
    const rowNumber = i + 1;
    const slug = cat.slug;

    try {
      const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
      if (existing) {
        duplicate++;
        rows.push({
          importJobId: catJob.id,
          rowNumber,
          status: 'DUPLICATE',
          entityType: 'CATEGORY',
          entityId: existing.id,
          rawData: cat as unknown as Prisma.InputJsonValue,
          errors: [],
          warnings: [`Category with slug "${slug}" already exists`],
        });
        continue;
      }

      const category = await prisma.category.upsert({
        where: { slug },
        update: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          seoTitle: generateSeoTitle(cat.name, 'category'),
          seoDescription: generateSeoDescription(cat.name, cat.subcategories.length),
          isActive: true,
        },
        create: {
          name: cat.name,
          slug,
          description: cat.description,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          seoTitle: generateSeoTitle(cat.name, 'category'),
          seoDescription: generateSeoDescription(cat.name, cat.subcategories.length),
          isActive: true,
        },
      });

      imported++;

      rows.push({
        importJobId: catJob.id,
        rowNumber,
        status: 'IMPORTED',
        entityType: 'CATEGORY',
        entityId: category.id,
        rawData: cat as unknown as Prisma.InputJsonValue,
        errors: [],
        warnings: [],
      });
    } catch (err) {
      error++;
      rows.push({
        importJobId: catJob.id,
        rowNumber,
        status: 'ERROR',
        entityType: 'CATEGORY',
        rawData: cat as unknown as Prisma.InputJsonValue,
        errors: [err instanceof Error ? err.message : String(err)],
        warnings: [],
      });
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.importJobRow.createMany({ data: batch });
  }

  const finalStatus = error > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
  await prisma.importJob.update({
    where: { id: catJob.id },
    data: {
      status: finalStatus,
      importedRows: imported,
      duplicateRows: duplicate,
      errorRows: error,
      completedAt: new Date(),
      summary: { totalCategories: INDUSTRY_CATEGORIES.length, imported, duplicate, error },
    },
  });

  console.log(`Categories seeded: ${imported} imported, ${duplicate} duplicate, ${error} error`);
  return { categoryMap: INDUSTRY_CATEGORIES };
}

async function seedSubcategories(categoryMap: typeof INDUSTRY_CATEGORIES) {
  const subJob = await prisma.importJob.create({
    data: {
      type: 'SUBCATEGORY',
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  const allSubs = categoryMap.flatMap((cat) =>
    cat.subcategories.map((sub) => ({ categorySlug: cat.slug, subName: sub }))
  );

  // Deterministic slugs (idempotent re-runs): subcategory names repeat across
  // parents, so disambiguate collisions with the parent's static slug.
  const topSlugs = new Set<string>(INDUSTRY_CATEGORIES.map((c) => c.slug));
  const usedSubSlugs = new Set<string>();
  await prisma.importJob.update({
    where: { id: subJob.id },
    data: { totalRows: allSubs.length },
  });

  const rows: Array<{
    importJobId: string;
    rowNumber: number;
    status: ImportRowStatus;
    entityType: string;
    entityId?: string;
    rawData?: Prisma.InputJsonValue;
    errors: string[];
    warnings: string[];
  }> = [];

  let imported = 0;
  let duplicate = 0;
  let error = 0;

  for (let i = 0; i < allSubs.length; i++) {
    const { categorySlug, subName } = allSubs[i];
    const rowNumber = i + 1;
    const baseSlug = generateSlug(subName);
    const slug =
      topSlugs.has(baseSlug) || usedSubSlugs.has(baseSlug)
        ? `${baseSlug}-${categorySlug}`
        : baseSlug;
    usedSubSlugs.add(slug);

    try {
      const parent = await prisma.category.findUnique({ where: { slug: categorySlug }, select: { id: true } });
      if (!parent) {
        error++;
        rows.push({
          importJobId: subJob.id,
          rowNumber,
          status: 'ERROR',
          entityType: 'SUBCATEGORY',
          rawData: { categorySlug, subName } as unknown as Prisma.InputJsonValue,
          errors: [`Parent category "${categorySlug}" not found`],
          warnings: [],
        });
        continue;
      }

      const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
      if (existing) {
        duplicate++;
        rows.push({
          importJobId: subJob.id,
          rowNumber,
          status: 'DUPLICATE',
          entityType: 'SUBCATEGORY',
          entityId: existing.id,
          rawData: { categorySlug, subName } as unknown as Prisma.InputJsonValue,
          errors: [],
          warnings: [`Subcategory with slug "${slug}" already exists`],
        });
        continue;
      }

      const subcategory = await prisma.category.upsert({
        where: { slug },
        update: {
          name: subName,
          parentId: parent.id,
          sortOrder: rowNumber,
          seoTitle: generateSeoTitle(subName, 'subcategory'),
          seoDescription: generateSeoDescription(subName, 0),
          isActive: true,
        },
        create: {
          name: subName,
          slug,
          parentId: parent.id,
          sortOrder: rowNumber,
          seoTitle: generateSeoTitle(subName, 'subcategory'),
          seoDescription: generateSeoDescription(subName, 0),
          isActive: true,
        },
      });

      imported++;

      rows.push({
        importJobId: subJob.id,
        rowNumber,
        status: 'IMPORTED',
        entityType: 'SUBCATEGORY',
        entityId: subcategory.id,
        rawData: { categorySlug, subName } as unknown as Prisma.InputJsonValue,
        errors: [],
        warnings: [],
      });
    } catch (err) {
      error++;
      rows.push({
        importJobId: subJob.id,
        rowNumber,
        status: 'ERROR',
        entityType: 'SUBCATEGORY',
        rawData: { categorySlug, subName } as unknown as Prisma.InputJsonValue,
        errors: [err instanceof Error ? err.message : String(err)],
        warnings: [],
      });
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.importJobRow.createMany({ data: batch });
  }

  const finalStatus = error > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
  await prisma.importJob.update({
    where: { id: subJob.id },
    data: {
      status: finalStatus,
      totalRows: allSubs.length,
      importedRows: imported,
      duplicateRows: duplicate,
      errorRows: error,
      completedAt: new Date(),
      summary: { totalSubcategories: allSubs.length, imported, duplicate, error },
    },
  });

  console.log(`Subcategories seeded: ${imported} imported, ${duplicate} duplicate, ${error} error`);
}

async function seedProductMasters() {
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null }, isActive: true },
    select: { id: true, name: true, parentId: true },
  });
  if (categories.length === 0) {
    console.log('No subcategories found, skipping ProductMaster seed');
    return;
  }

  const subcategoryMap = new Map<string, typeof categories[0]>();
  for (const c of categories) subcategoryMap.set(c.name.toLowerCase(), c);

  const productTemplates = [
    { name: 'High Tensile Steel Bars', unit: 'ton', moq: 1, priceRangeMin: 45000, priceRangeMax: 65000, hsCode: '72142010' },
    { name: 'Galvanized Iron Pipes', unit: 'meter', moq: 100, priceRangeMin: 80, priceRangeMax: 250, hsCode: '73063010' },
    { name: 'Stainless Steel Sheets 304', unit: 'kg', moq: 500, priceRangeMin: 180, priceRangeMax: 320, hsCode: '72193510' },
    { name: 'Industrial Grade Cement 53 Grade', unit: 'bag', moq: 100, priceRangeMin: 350, priceRangeMax: 450, hsCode: '25232910' },
    { name: 'PVC Electrical Cables 2.5 sqmm', unit: 'meter', moq: 500, priceRangeMin: 12, priceRangeMax: 25, hsCode: '85444920' },
    { name: 'Polypropylene Granules', unit: 'kg', moq: 1000, priceRangeMin: 85, priceRangeMax: 145, hsCode: '39021000' },
    { name: 'Aluminum Ingots P1020', unit: 'kg', moq: 500, priceRangeMin: 195, priceRangeMax: 240, hsCode: '76011010' },
    { name: 'Cotton Grey Fabric 60x60', unit: 'meter', moq: 500, priceRangeMin: 55, priceRangeMax: 95, hsCode: '52081110' },
    { name: 'Corrugated Boxes 3 Ply', unit: 'piece', moq: 500, priceRangeMin: 8, priceRangeMax: 25, hsCode: '48191010' },
    { name: 'Solar Panel 300W Mono', unit: 'piece', moq: 50, priceRangeMin: 8500, priceRangeMax: 12000, hsCode: '85414300' },
  ];

  const prodJob = await prisma.importJob.create({
    data: {
      type: 'PRODUCT_MASTER',
      status: 'RUNNING',
      totalRows: productTemplates.length,
      startedAt: new Date(),
    },
  });

  const rows: Array<{
    importJobId: string;
    rowNumber: number;
    status: ImportRowStatus;
    entityType: string;
    entityId?: string;
    rawData?: Prisma.InputJsonValue;
    errors: string[];
    warnings: string[];
  }> = [];

  let imported = 0;
  let duplicate = 0;
  let error = 0;

  for (let i = 0; i < productTemplates.length; i++) {
    const tmpl = productTemplates[i];
    const rowNumber = i + 1;
    const slug = generateSlug(tmpl.name);

    try {
      const subcatEntry = categories[i % categories.length];
      const existing = await prisma.productMaster.findUnique({ where: { slug }, select: { id: true } });
      if (existing) {
        duplicate++;
        rows.push({
          importJobId: prodJob.id,
          rowNumber,
          status: 'DUPLICATE',
          entityType: 'PRODUCT_MASTER',
          entityId: existing.id,
          rawData: tmpl as unknown as Prisma.InputJsonValue,
          errors: [],
          warnings: [`Product master with slug "${slug}" already exists`],
        });
        continue;
      }

      const keywords = tmpl.name.toLowerCase().split(' ').filter(Boolean);
      const synonyms = [...keywords];
      if (tmpl.name.includes('Steel')) synonyms.push('steel bars rods');

      const product = await prisma.productMaster.upsert({
        where: { slug },
        update: {
          name: tmpl.name,
          categoryId: subcatEntry.parentId,
          subcategoryId: subcatEntry.id,
          unit: tmpl.unit,
          moq: tmpl.moq,
          priceRangeMin: tmpl.priceRangeMin,
          priceRangeMax: tmpl.priceRangeMax,
          hsCode: tmpl.hsCode,
          searchKeywords: keywords,
          synonyms,
          tags: keywords,
          metaTitle: `${tmpl.name} - TRADINGO | Suppliers & Manufacturers`,
          metaDescription: `Find top ${tmpl.name.toLowerCase()} suppliers and manufacturers in India. Get best price and quality products on TRADINGO B2B marketplace.`,
          isActive: true,
        },
        create: {
          name: tmpl.name,
          slug,
          categoryId: subcatEntry.parentId,
          subcategoryId: subcatEntry.id,
          unit: tmpl.unit,
          moq: tmpl.moq,
          priceRangeMin: tmpl.priceRangeMin,
          priceRangeMax: tmpl.priceRangeMax,
          hsCode: tmpl.hsCode,
          searchKeywords: keywords,
          synonyms,
          tags: keywords,
          metaTitle: `${tmpl.name} - TRADINGO | Suppliers & Manufacturers`,
          metaDescription: `Find top ${tmpl.name.toLowerCase()} suppliers and manufacturers in India. Get best price and quality products on TRADINGO B2B marketplace.`,
          isActive: true,
        },
      });

      imported++;

      rows.push({
        importJobId: prodJob.id,
        rowNumber,
        status: 'IMPORTED',
        entityType: 'PRODUCT_MASTER',
        entityId: product.id,
        rawData: tmpl as unknown as Prisma.InputJsonValue,
        errors: [],
        warnings: [],
      });
    } catch (err) {
      error++;
      rows.push({
        importJobId: prodJob.id,
        rowNumber,
        status: 'ERROR',
        entityType: 'PRODUCT_MASTER',
        rawData: tmpl as unknown as Prisma.InputJsonValue,
        errors: [err instanceof Error ? err.message : String(err)],
        warnings: [],
      });
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.importJobRow.createMany({ data: batch });
  }

  const finalStatus = error > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
  await prisma.importJob.update({
    where: { id: prodJob.id },
    data: {
      status: finalStatus,
      importedRows: imported,
      duplicateRows: duplicate,
      errorRows: error,
      completedAt: new Date(),
      summary: { totalProducts: productTemplates.length, imported, duplicate, error },
    },
  });

  console.log(`ProductMasters seeded: ${imported} imported, ${duplicate} duplicate, ${error} error`);
}

async function seedServiceMasters() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    select: { id: true, name: true },
  });
  if (categories.length === 0) {
    console.log('No categories found, skipping ServiceMaster seed');
    return;
  }

  const serviceTemplates = [
    { name: 'Custom Software Development Services', unit: 'project', priceRangeMin: 50000, priceRangeMax: 5000000 },
    { name: 'Freight Forwarding Services', unit: 'container', priceRangeMin: 15000, priceRangeMax: 200000 },
    { name: 'Digital Marketing & SEO Services', unit: 'month', priceRangeMin: 15000, priceRangeMax: 150000 },
    { name: 'Industrial Equipment Maintenance', unit: 'contract', priceRangeMin: 50000, priceRangeMax: 1000000 },
    { name: 'Warehousing & Storage Services', unit: 'sqft', priceRangeMin: 5, priceRangeMax: 25 },
    { name: 'IT Infrastructure Consulting', unit: 'project', priceRangeMin: 100000, priceRangeMax: 3000000 },
    { name: 'Customs Clearance Services', unit: 'shipment', priceRangeMin: 5000, priceRangeMax: 50000 },
    { name: 'Quality Testing & Inspection', unit: 'batch', priceRangeMin: 5000, priceRangeMax: 100000 },
  ];

  const servJob = await prisma.importJob.create({
    data: {
      type: 'SERVICE_MASTER',
      status: 'RUNNING',
      totalRows: serviceTemplates.length,
      startedAt: new Date(),
    },
  });

  const rows: Array<{
    importJobId: string;
    rowNumber: number;
    status: ImportRowStatus;
    entityType: string;
    entityId?: string;
    rawData?: Prisma.InputJsonValue;
    errors: string[];
    warnings: string[];
  }> = [];

  let imported = 0;
  let duplicate = 0;
  let error = 0;

  for (let i = 0; i < serviceTemplates.length; i++) {
    const tmpl = serviceTemplates[i];
    const rowNumber = i + 1;
    const slug = generateSlug(tmpl.name);

    try {
      const cat = categories[i % categories.length];
      const existing = await prisma.serviceMaster.findUnique({ where: { slug }, select: { id: true } });
      if (existing) {
        duplicate++;
        rows.push({
          importJobId: servJob.id,
          rowNumber,
          status: 'DUPLICATE',
          entityType: 'SERVICE_MASTER',
          entityId: existing.id,
          rawData: tmpl as unknown as Prisma.InputJsonValue,
          errors: [],
          warnings: [`Service master with slug "${slug}" already exists`],
        });
        continue;
      }

      const keywords = tmpl.name.toLowerCase().split(' ').filter((w) => w.length > 3);

      const service = await prisma.serviceMaster.upsert({
        where: { slug },
        update: {
          name: tmpl.name,
          categoryId: cat.id,
          unit: tmpl.unit,
          priceRangeMin: tmpl.priceRangeMin,
          priceRangeMax: tmpl.priceRangeMax,
          searchKeywords: keywords,
          synonyms: keywords,
          tags: keywords,
          metaTitle: `${tmpl.name} - TRADINGO | Top Service Providers India`,
          metaDescription: `Find best ${tmpl.name.toLowerCase()} providers in India. Compare quotes and hire trusted service partners on TRADINGO B2B marketplace.`,
          isActive: true,
        },
        create: {
          name: tmpl.name,
          slug,
          categoryId: cat.id,
          unit: tmpl.unit,
          priceRangeMin: tmpl.priceRangeMin,
          priceRangeMax: tmpl.priceRangeMax,
          searchKeywords: keywords,
          synonyms: keywords,
          tags: keywords,
          metaTitle: `${tmpl.name} - TRADINGO | Top Service Providers India`,
          metaDescription: `Find best ${tmpl.name.toLowerCase()} providers in India. Compare quotes and hire trusted service partners on TRADINGO B2B marketplace.`,
          isActive: true,
        },
      });

      imported++;

      rows.push({
        importJobId: servJob.id,
        rowNumber,
        status: 'IMPORTED',
        entityType: 'SERVICE_MASTER',
        entityId: service.id,
        rawData: tmpl as unknown as Prisma.InputJsonValue,
        errors: [],
        warnings: [],
      });
    } catch (err) {
      error++;
      rows.push({
        importJobId: servJob.id,
        rowNumber,
        status: 'ERROR',
        entityType: 'SERVICE_MASTER',
        rawData: tmpl as unknown as Prisma.InputJsonValue,
        errors: [err instanceof Error ? err.message : String(err)],
        warnings: [],
      });
    }
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.importJobRow.createMany({ data: batch });
  }

  const finalStatus = error > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
  await prisma.importJob.update({
    where: { id: servJob.id },
    data: {
      status: finalStatus,
      importedRows: imported,
      duplicateRows: duplicate,
      errorRows: error,
      completedAt: new Date(),
      summary: { totalServices: serviceTemplates.length, imported, duplicate, error },
    },
  });

  console.log(`ServiceMasters seeded: ${imported} imported, ${duplicate} duplicate, ${error} error`);
}

async function main() {
  console.log('Starting TRADINGO seed...');

  await seedAdminUsers();

  const { categoryMap } = await seedCategories();
  await seedSubcategories(categoryMap);
  await seedProductMasters();
  await seedServiceMasters();

  console.log('TRADINGO seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
