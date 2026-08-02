import { PrismaClient } from '@prisma/client';
import { parseCsv } from './seed.utils.ts';
import { CategoriesSeeder } from './categories.seed.ts';
import { SubcategoriesSeeder } from './subcategories.seed.ts';
import { ProductMastersSeeder } from './product-masters.seed.ts';
import { ServiceMastersSeeder } from './service-masters.seed.ts';
import { CatalogImportSeeder, SeedMetadata } from './catalog-import.seed.ts';
import { resolve } from 'path';
import { slugify, BATCH_SIZE } from './seed.utils.ts';

const CSV_PATH = resolve(process.cwd(), 'product service catalog.csv');

const prisma = new PrismaClient();

async function main() {
  console.log('=== TRADINGO Catalog Seed ===');
  console.log(`CSV: ${CSV_PATH}`);
  console.log('');

  const parsed = parseCsv(CSV_PATH);
  console.log(`Parsed ${parsed.rows.length} rows, ${parsed.categories.length} categories, ${parsed.subcategoryMap.size} parent categories with subcategories`);

  // 1. Categories
  console.log('\n--- Seeding Categories ---');
  const catSeeder = new CategoriesSeeder(prisma);
  const catResult = await catSeeder.run(parsed.categories);
  console.log(`Categories: ${catResult.status} (${catResult.imported} imported, ${catResult.duplicate} duplicate, ${catResult.error} errors)`);

  // 2. Subcategories
  console.log('\n--- Seeding Subcategories ---');
  const subEntries: { category: string; subCategory: string }[] = [];
  for (const [cat, subs] of parsed.subcategoryMap) {
    for (const sub of subs) {
      subEntries.push({ category: cat, subCategory: sub });
    }
  }
  const subSeeder = new SubcategoriesSeeder(prisma);
  const subResult = await subSeeder.run(subEntries);
  console.log(`Subcategories: ${subResult.status} (${subResult.imported} imported, ${subResult.duplicate} duplicate, ${subResult.error} errors)`);

  // 3. Product Masters
  console.log('\n--- Seeding Product Masters ---');
  const productRows = parsed.rows.filter((r) => r.type === 'Product');
  const pmSeeder = new ProductMastersSeeder(prisma);
  const pmResult = await pmSeeder.run(productRows);
  console.log(`ProductMasters: ${pmResult.status} (${pmResult.imported} imported, ${pmResult.duplicate} duplicate, ${pmResult.error} errors)`);

  // 4. Service Masters
  console.log('\n--- Seeding Service Masters ---');
  const serviceRows = parsed.rows.filter((r) => r.type === 'Service');
  const smSeeder = new ServiceMastersSeeder(prisma);
  const smResult = await smSeeder.run(serviceRows);
  console.log(`ServiceMasters: ${smResult.status} (${smResult.imported} imported, ${smResult.duplicate} duplicate, ${smResult.error} errors)`);

  // 5. Import Metadata
  console.log('\n--- Recording Import Metadata ---');
  const meta: SeedMetadata = {
    categoryCount: catResult.imported,
    subcategoryCount: subResult.imported,
    productMasterCount: pmResult.imported,
    serviceMasterCount: smResult.imported,
  };
  const metaSeeder = new CatalogImportSeeder(prisma);
  const metaResult = await metaSeeder.run(meta);
  console.log(`Metadata: ${metaResult.status}`);

  // 6. Master Catalog Categories
  console.log('\n--- Seeding Master Catalog Categories ---');
  let catCatalogCreated = 0;
  const catSlugSet = new Set<string>();
  for (const name of parsed.categories) {
    const slug = slugify(name) || 'category';
    try {
      await prisma.catalogCategory.upsert({
        where: { slug },
        update: { name, isActive: true },
        create: { name, slug, description: name, icon: 'default-category', isActive: true },
      });
      catSlugSet.add(slug);
      catCatalogCreated++;
    } catch (err) {
      console.error(`  Error creating catalog category "${name}": ${err}`);
    }
  }
  console.log(`  Catalog Categories: ${catCatalogCreated} created`);

  // 7. Master Catalog Subcategories
  console.log('\n--- Seeding Master Catalog Subcategories ---');
  let subCatalogCreated = 0;
  for (const [catName, subs] of parsed.subcategoryMap) {
    const catSlug = slugify(catName) || 'category';
    const catalogCat = await prisma.catalogCategory.findUnique({ where: { slug: catSlug } });
    if (!catalogCat) continue;
    for (const subName of subs) {
      const subSlug = slugify(subName) || 'subcategory';
      try {
        await prisma.catalogSubcategory.upsert({
          where: { categoryId_slug: { categoryId: catalogCat.id, slug: subSlug } },
          update: { name: subName },
          create: { name: subName, slug: subSlug, categoryId: catalogCat.id },
        });
        subCatalogCreated++;
      } catch (err) {
        if (!(err as any)?.message?.includes('Unique constraint')) {
          console.error(`  Error creating catalog subcategory "${subName}": ${err}`);
        }
      }
    }
  }
  console.log(`  Catalog Subcategories: ${subCatalogCreated} created`);

  // 8. Master Catalog Items + CatalogUnit
  console.log('\n--- Seeding Master Catalog Items ---');
  let itemsCreated = 0;
  const unitSet = new Set<string>();
  for (let i = 0; i < parsed.rows.length; i += BATCH_SIZE) {
    const batch = parsed.rows.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      if (row.unit) unitSet.add(row.unit.trim());
      if (row.altUnits) unitSet.add(row.altUnits.trim());
      try {
        const catSlug = slugify(row.category) || 'category';
        const catalogCat = await prisma.catalogCategory.findUnique({ where: { slug: catSlug } });
        if (!catalogCat) continue;
        const subSlug = slugify(row.subCategory) || 'subcategory';
        const catalogSub = await prisma.catalogSubcategory.findUnique({
          where: { categoryId_slug: { categoryId: catalogCat.id, slug: subSlug } },
        });
        if (!catalogSub) continue;
        const slug = slugify(row.name) || `item-${row.serialNo}`;
        const hsCode = row.type === 'Product' ? `HS-${row.serialNo}` : undefined;
        const sacCode = row.type === 'Service' ? `SAC-${row.serialNo}` : undefined;
        await prisma.catalogItem.upsert({
          where: { slug },
          update: { isActive: true },
          create: {
            name: row.name,
            slug,
            type: row.type === 'Product' ? 'Product' : 'Service',
            subcategoryId: catalogSub.id,
            isActive: true,
            unit: row.unit || undefined,
            hsCode,
            sacCode,
          },
        });
        itemsCreated++;
      } catch (err) {
        if (!(err as any)?.message?.includes('Unique constraint')) {
          console.error(`  Error creating catalog item "${row.name}": ${err}`);
        }
      }
    }
  }
  console.log(`  Catalog Items: ${itemsCreated} created`);

  // 9. Catalog Units
  console.log('\n--- Seeding Catalog Units ---');
  let unitsCreated = 0;
  for (const unit of [...unitSet].filter(Boolean)) {
    try {
      await prisma.catalogUnit.upsert({
        where: { name: unit },
        update: { symbol: unit },
        create: { name: unit, symbol: unit, category: 'imported' },
      });
      unitsCreated++;
    } catch (err) {
      console.error(`  Error creating catalog unit "${unit}": ${err}`);
    }
  }
  console.log(`  Catalog Units: ${unitsCreated} created`);

  // Summary
  console.log('\n=== Seed Complete ===');
  console.log(`  Categories:          ${catResult.imported}`);
  console.log(`  Subcategories:       ${subResult.imported}`);
  console.log(`  ProductMasters:      ${pmResult.imported}`);
  console.log(`  ServiceMasters:      ${smResult.imported}`);
  console.log(`  Catalog Categories:  ${catCatalogCreated}`);
  console.log(`  Catalog Subcategories: ${subCatalogCreated}`);
  console.log(`  Catalog Items:       ${itemsCreated}`);
  console.log(`  Catalog Units:       ${unitsCreated}`);
  console.log(`  Total:               ${catResult.imported + subResult.imported + pmResult.imported + smResult.imported + itemsCreated + unitsCreated}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
