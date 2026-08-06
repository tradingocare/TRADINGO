/**
 * Sprint P0.2A — full reindex of all products into the OpenSearch `products` index.
 * Doc shape = buildProductIndexDoc (single source of truth shared with the API writers).
 * Run: pnpm exec ts-node --project prisma/seeds/tsconfig.json prisma/seed-scripts/products-index-sync.ts
 */
import { PrismaClient } from '@prisma/client';
import { buildProductIndexDoc } from '../../apps/api/src/modules/products/product-index.doc';
import { INDEX_MAPPINGS } from '../../apps/api/src/modules/tradfind/tradfind.config';

const prisma = new PrismaClient();
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || 'http://localhost:9200';
const PRODUCTS_INDEX = 'products';
const BATCH_SIZE = 100;

async function ensureIndex() {
  const head = await fetch(`${OPENSEARCH_ENDPOINT}/${PRODUCTS_INDEX}`, { method: 'HEAD' });
  if (head.status === 200) return;
  const res = await fetch(`${OPENSEARCH_ENDPOINT}/${PRODUCTS_INDEX}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INDEX_MAPPINGS[PRODUCTS_INDEX]),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Index creation failed: ${res.status} ${text}`);
  }
  console.log(`Created index ${PRODUCTS_INDEX} with canonical mapping`);
}

const PRODUCT_INCLUDE = {
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      trustScore: true,
      verificationLevel: true,
      businessType: true,
      locations: {
        select: { city: true, state: true, country: true, isPrimary: true },
        where: { deletedAt: null },
      },
    },
  },
  category: { select: { id: true, name: true, slug: true } },
  industry: { select: { id: true, name: true, slug: true } },
  inventory: { select: { availableQuantity: true, stockStatus: true } },
  media: { select: { url: true, type: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } },
  specifications: { select: { key: true, value: true } },
  priceSlabs: { select: { minQty: true, maxQty: true, price: true, currency: true }, orderBy: { minQty: 'asc' as const } },
  catalogItem: { select: { id: true, slug: true, subcategory: { select: { name: true } } } },
};

async function main() {
  await ensureIndex();
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Loaded ${products.length} products`);

  let indexed = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const ndjson: string[] = [];
    for (const product of batch) {
      const doc = buildProductIndexDoc(product as any);
      ndjson.push(JSON.stringify({ index: { _index: PRODUCTS_INDEX, _id: product.id } }));
      ndjson.push(JSON.stringify(doc));
    }
    const res = await fetch(`${OPENSEARCH_ENDPOINT}/_bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-ndjson' },
      body: ndjson.join('\n') + '\n',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bulk index failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as any;
    const errors = json.items?.filter((it: any) => it.index?.error).length || 0;
    if (errors > 0) {
      const sample = JSON.stringify(json.items.find((it: any) => it.index?.error)?.index?.error).slice(0, 300);
      throw new Error(`${errors} items failed; sample: ${sample}`);
    }
    indexed += batch.length;
    console.log(`Indexed batch ${i + batch.length}/${products.length}`);
  }

  console.log(`REINDEX COMPLETE: ${indexed} products indexed to ${PRODUCTS_INDEX}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
