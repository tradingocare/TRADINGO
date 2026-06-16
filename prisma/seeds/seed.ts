import { PrismaClient } from '@prisma/client';
import { parseCsv } from './seed.utils.ts';
import { CategoriesSeeder } from './categories.seed.ts';
import { SubcategoriesSeeder } from './subcategories.seed.ts';
import { ProductMastersSeeder } from './product-masters.seed.ts';
import { ServiceMastersSeeder } from './service-masters.seed.ts';
import { CatalogImportSeeder, SeedMetadata } from './catalog-import.seed.ts';
import { resolve } from 'path';

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

  // Summary
  console.log('\n=== Seed Complete ===');
  console.log(`  Categories:     ${catResult.imported}`);
  console.log(`  Subcategories:  ${subResult.imported}`);
  console.log(`  ProductMasters: ${pmResult.imported}`);
  console.log(`  ServiceMasters: ${smResult.imported}`);
  console.log(`  Total:          ${catResult.imported + subResult.imported + pmResult.imported + smResult.imported}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
