/**
 * Sprint P0.2A — data prerequisites for products index enrichment.
 * Idempotent: safe to run multiple times.
 *  - Creates master-catalog Category/Subcategory/Item rows (deterministic slugs)
 *  - Links seed products (prod-001..005) to CatalogItems via catalogItemId
 *  - Ensures each seed product has at least one IMAGE media row (example.com pattern)
 *  - Ensures all 5 seed products have price slabs (MOSFET had none)
 *  - Backfills product.unit for seed products (priceUnit source)
 * Run: pnpm exec ts-node --project prisma/seeds/tsconfig.json prisma/seed-scripts/p02a-seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATALOG: {
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  items: { name: string; slug: string; keywords: string[]; synonyms: string[] }[];
}[] = [
  {
    category: 'PCB Components',
    categorySlug: 'pcb-components',
    subcategory: 'PCB Boards',
    subcategorySlug: 'pcb-boards',
    items: [
      { name: 'Industrial PCB Board 4-Layer', slug: 'industrial-pcb-board-4-layer', keywords: ['pcb', 'printed circuit board', '4-layer'], synonyms: ['pcb board', 'printed circuit board'] },
    ],
  },
  {
    category: 'Organic Chemicals',
    categorySlug: 'organic-chemicals',
    subcategory: 'Industrial Solvents',
    subcategorySlug: 'industrial-solvents',
    items: [
      { name: 'Industrial Grade Solvent 99.9%', slug: 'industrial-grade-solvent-99-9', keywords: ['solvent', 'chemical', 'industrial'], synonyms: ['chemical solvent'] },
    ],
  },
  {
    category: 'Semiconductors',
    categorySlug: 'semiconductors',
    subcategory: 'Active Components',
    subcategorySlug: 'active-components',
    items: [
      { name: 'MOSFET Transistor 2N7000', slug: 'mosfet-transistor-2n7000', keywords: ['mosfet', 'transistor', '2n7000'], synonyms: ['field effect transistor'] },
    ],
  },
  {
    category: 'CNC Machines',
    categorySlug: 'cnc-machines',
    subcategory: 'Machine Tools',
    subcategorySlug: 'machine-tools',
    items: [
      { name: 'CNC Milling Machine 5-Axis', slug: 'cnc-milling-machine-5-axis', keywords: ['cnc', 'milling', '5-axis'], synonyms: ['cnc machine'] },
    ],
  },
  {
    category: 'Corrugated Boxes',
    categorySlug: 'corrugated-boxes',
    subcategory: 'Packaging Materials',
    subcategorySlug: 'packaging-materials',
    items: [
      { name: 'Corrugated Box 12x12x12', slug: 'corrugated-box-12x12x12', keywords: ['corrugated', 'box', 'packaging'], synonyms: ['carton box', 'cardboard box'] },
    ],
  },
];

const MOSFET_SLABS = [
  { minQty: 50, maxQty: 999, price: 8.0, currency: 'INR' },
  { minQty: 1000, maxQty: null, price: 6.5, currency: 'INR' },
];

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  const byName = new Map(products.map((p) => [p.name.toLowerCase(), p.id]));
  let itemsCreated = 0;
  let linksSet = 0;
  let mediaAdded = 0;
  let slabsAdded = 0;
  let unitsBackfilled = 0;

  for (const entry of CATALOG) {
    const category = await prisma.catalogCategory.upsert({
      where: { slug: entry.categorySlug },
      update: { name: entry.category, seoTitle: entry.category, seoDescription: `${entry.category} - Browse products on TRADINGO`, isActive: true },
      create: { slug: entry.categorySlug, name: entry.category, seoTitle: entry.category, seoDescription: `${entry.category} - Browse products on TRADINGO`, isActive: true },
    });
    const subcategory = await prisma.catalogSubcategory.upsert({
      where: { categoryId_slug: { categoryId: category.id, slug: entry.subcategorySlug } },
      update: { name: entry.subcategory, seoTitle: entry.subcategory, seoDescription: `${entry.subcategory} - Browse products on TRADINGO` },
      create: { categoryId: category.id, slug: entry.subcategorySlug, name: entry.subcategory, seoTitle: entry.subcategory, seoDescription: `${entry.subcategory} - Browse products on TRADINGO` },
    });

    for (const item of entry.items) {
      const catalogItem = await prisma.catalogItem.upsert({
        where: { slug: item.slug },
        update: { subcategoryId: subcategory.id, name: item.name, keywords: item.keywords, synonyms: item.synonyms, isActive: true },
        create: {
          subcategoryId: subcategory.id,
          type: 'Product',
          name: item.name,
          slug: item.slug,
          unit: 'piece',
          keywords: item.keywords,
          synonyms: item.synonyms,
          seoTitle: item.name,
          seoDescription: item.name,
          isActive: true,
        },
      });
      itemsCreated++;

      const productId = byName.get(item.name.toLowerCase());
      if (productId) {
        await prisma.product.update({ where: { id: productId }, data: { catalogItemId: catalogItem.id } });
        linksSet++;

        const mediaCount = await prisma.productMedia.count({ where: { productId } });
        if (mediaCount === 0) {
          await prisma.productMedia.create({
            data: { productId, type: 'IMAGE', url: `https://example.com/${item.slug}.jpg`, title: item.name, isPrimary: true, sortOrder: 0 },
          });
          mediaAdded++;
        }

        const slabCount = await prisma.productPriceSlab.count({ where: { productId } });
        if (slabCount === 0) {
          await prisma.productPriceSlab.createMany({ data: MOSFET_SLABS.map((s) => ({ productId, ...s })) });
          slabsAdded++;
        }

        const prod = await prisma.product.findUnique({ where: { id: productId }, select: { unit: true } });
        if (!prod?.unit) {
          await prisma.product.update({ where: { id: productId }, data: { unit: 'piece' } });
          unitsBackfilled++;
        }
      }
    }
  }

  console.log(
    `P0.2A seed complete: items=${itemsCreated} links=${linksSet} mediaAdded=${mediaAdded} slabsAdded=${slabsAdded} unitsBackfilled=${unitsBackfilled}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
