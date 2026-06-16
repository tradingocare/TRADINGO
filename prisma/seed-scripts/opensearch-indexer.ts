import { PrismaClient } from '@prisma/client';

const DEFAULT_BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const DEFAULT_INDEX_NAME = 'catalog';

function buildIndexMapping() {
  return {
    settings: {
      number_of_shards: 2,
      number_of_replicas: 1,
      analysis: {
        analyzer: {
          catalog_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'stop', 'snowball', 'edge_ngram_filter'],
          },
          search_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'stop', 'snowball'],
          },
        },
        filter: {
          edge_ngram_filter: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 20,
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        entityType: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'catalog_analyzer',
          search_analyzer: 'search_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            raw: { type: 'text', analyzer: 'standard' },
          },
        },
        slug: { type: 'keyword' },
        categoryId: { type: 'keyword' },
        subcategoryId: { type: 'keyword' },
        shortDescription: { type: 'text', analyzer: 'standard' },
        description: { type: 'text', analyzer: 'standard' },
        unit: { type: 'keyword' },
        moq: { type: 'integer' },
        priceRangeMin: { type: 'float' },
        priceRangeMax: { type: 'float' },
        currency: { type: 'keyword' },
        hsCode: { type: 'keyword' },
        isActive: { type: 'boolean' },
        searchKeywords: { type: 'keyword' },
        synonyms: { type: 'keyword' },
        tags: { type: 'keyword' },
        metaTitle: { type: 'text', analyzer: 'standard' },
        metaDescription: { type: 'text', analyzer: 'standard' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  };
}

function buildBulkActions(records: any[], indexName: string): string[] {
  const actions: string[] = [];
  for (const record of records) {
    const action = JSON.stringify({ index: { _index: indexName, _id: record.id } });
    const doc = JSON.stringify(record);
    actions.push(action);
    actions.push(doc);
  }
  return actions;
}

async function sendBulkRequest(
  endpoint: string,
  body: string,
  retries: number = MAX_RETRIES,
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${endpoint}/_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson' },
        body,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenSearch bulk request failed: ${response.status} - ${text}`);
      }
      return { success: true };
    } catch (err) {
      if (attempt === retries) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

async function ensureIndex(endpoint: string, indexName: string): Promise<void> {
  const url = `${endpoint}/${indexName}`;
  const existsResponse = await fetch(url, { method: 'HEAD' });
  if (existsResponse.status === 200) return;

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildIndexMapping()),
  });
  if (!response.ok && response.status !== 400) {
    const text = await response.text();
    throw new Error(`Failed to create index: ${response.status} - ${text}`);
  }
}

async function deleteIndex(endpoint: string, indexName: string): Promise<void> {
  const response = await fetch(`${endpoint}/${indexName}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Failed to delete index: ${response.status} - ${text}`);
  }
}

export async function indexCatalogToOpenSearch(
  prisma: PrismaClient,
  opensearchEndpoint?: string,
): Promise<{ indexed: number; errors: number }> {
  const endpoint = opensearchEndpoint || process.env.OPENSEARCH_ENDPOINT || 'http://localhost:9200';
  const indexName = process.env.OPENSEARCH_INDEX || DEFAULT_INDEX_NAME;

  await ensureIndex(endpoint, indexName);

  let totalIndexed = 0;
  let totalErrors = 0;

  const indexBatch = async (records: any[], entityType: string) => {
    for (let i = 0; i < records.length; i += DEFAULT_BATCH_SIZE) {
      const batch = records.slice(i, i + DEFAULT_BATCH_SIZE).map((r) => ({
        ...r,
        entityType,
        priceRangeMin: r.priceRangeMin ? Number(r.priceRangeMin) : undefined,
        priceRangeMax: r.priceRangeMax ? Number(r.priceRangeMax) : undefined,
      }));
      const actions = buildBulkActions(batch, indexName);
      const result = await sendBulkRequest(endpoint, actions.join('\n') + '\n');
      if (result.success) {
        totalIndexed += batch.length;
      } else {
        totalErrors += batch.length;
        console.error(`Failed to index ${entityType} batch starting at ${i}: ${result.error}`);
      }
    }
  };

  try {
    const products = await prisma.productMaster.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        aliases: { select: { alias: true } },
      },
    });
    await indexBatch(products, 'PRODUCT_MASTER');
    console.log(`Indexed ${products.length} ProductMaster records`);
  } catch (err) {
    console.error('Error indexing ProductMaster records:', err);
    totalErrors += 1;
  }

  try {
    const services = await prisma.serviceMaster.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    await indexBatch(services, 'SERVICE_MASTER');
    console.log(`Indexed ${services.length} ServiceMaster records`);
  } catch (err) {
    console.error('Error indexing ServiceMaster records:', err);
    totalErrors += 1;
  }

  return { indexed: totalIndexed, errors: totalErrors };
}

export async function reindexAll(
  opensearchEndpoint?: string,
): Promise<{ indexed: number; errors: number }> {
  const endpoint = opensearchEndpoint || process.env.OPENSEARCH_ENDPOINT || 'http://localhost:9200';
  const indexName = process.env.OPENSEARCH_INDEX || DEFAULT_INDEX_NAME;

  await deleteIndex(endpoint, indexName);

  const prisma = new PrismaClient();
  try {
    const result = await indexCatalogToOpenSearch(prisma, opensearchEndpoint);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}
