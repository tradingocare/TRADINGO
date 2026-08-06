/**
 * One-off reindex script: rebuilds the OpenSearch `products` index from Prisma.
 * Usage: npm run reindex:products
 * Reuses buildProductIndexDoc() + the same include shape as ProductsService.syncOpenSearch.
 */
import { PrismaClient } from '@prisma/client';
import { Client } from '@opensearch-project/opensearch';
import { buildProductIndexDoc } from '../modules/products/product-index.doc';

const prisma = new PrismaClient();
const client = new Client({
  node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || '',
  },
  ssl: { rejectUnauthorized: process.env.OPENSEARCH_REJECT_UNAUTHORIZED !== 'false' },
  maxRetries: 3,
  requestTimeout: 15000,
});

const PRODUCT_INDEX = 'products';
const BATCH = 500;

const PRODUCT_INCLUDE = {
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      trustScore: true,
      verificationLevel: true,
      businessType: true,
      establishedYear: true,
      gstNumber: true,
      certifications: true,
      locations: {
        select: { city: true, state: true, country: true, isPrimary: true },
        where: { deletedAt: null },
      },
    },
  },
  category: { select: { id: true, name: true, slug: true } },
  industry: { select: { id: true, name: true, slug: true } },
  inventory: { select: { availableQuantity: true, stockStatus: true } },
  media: { select: { id: true, url: true, type: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
  specifications: { select: { key: true, value: true } },
  priceSlabs: { select: { minQty: true, maxQty: true, price: true, currency: true }, orderBy: { minQty: 'asc' } },
  catalogItem: { select: { id: true, slug: true, subcategory: { select: { name: true } } } },
} as const;

async function main() {
  const catalogItems = await prisma.catalogItem.findMany({
    where: { isActive: true },
    include: { subcategory: { include: { category: true } } },
  });
  const catalogByName = new Map<string, (typeof catalogItems)[number]>();
  for (const item of catalogItems) {
    catalogByName.set(item.name.toLowerCase(), item);
  }

  let cursor: string | undefined;
  let indexed = 0;
  const bulkOps: any[] = [];

  const flush = async () => {
    if (!bulkOps.length) return;
    const res = await client.bulk({ body: bulkOps, refresh: false });
    if (res.body.errors) {
      const errs = (res.body.items || [])
        .map((item: any) => item.index?.error)
        .filter(Boolean);
      console.error(`Bulk errors (${errs.length}):`, JSON.stringify(errs.slice(0, 5)));
    }
    bulkOps.length = 0;
  };

  do {
    const products = await prisma.product.findMany({
      where: { deletedAt: null, ...(cursor ? { id: { gt: cursor } } : {}) },
      take: BATCH,
      orderBy: { id: 'asc' },
      include: PRODUCT_INCLUDE as any,
    });
    if (!products.length) break;

    for (const product of products) {
      const match = catalogByName.get(product.name.toLowerCase());
      const enrichment = match
        ? {
            catalogItemId: match.id,
            catalogItemSlug: match.slug,
            catalogCategoryPath: `${match.subcategory.category.name} > ${match.subcategory.name}`,
            catalogKeywords: match.keywords || [],
            catalogSynonyms: match.synonyms || [],
            subCategoryName: match.subcategory.name,
          }
        : {
            catalogItemId: null,
            catalogItemSlug: null,
            catalogCategoryPath: null,
            catalogKeywords: [],
            catalogSynonyms: [],
            subCategoryName: null,
          };

      bulkOps.push(
        { index: { _index: PRODUCT_INDEX, _id: product.id } },
        buildProductIndexDoc({ ...(product as any), enrichment }),
      );
    }

    await flush();
    indexed += products.length;
    console.log(`Indexed ${indexed} products so far...`);
    cursor = products[products.length - 1].id;
  } while (true);

  console.log(`Reindex complete. ${indexed} products indexed into "${PRODUCT_INDEX}".`);
}

main()
  .catch((err) => {
    console.error('Reindex failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
