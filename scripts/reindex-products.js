#!/usr/bin/env node
/**
 * reindex-products.js — (re)build the OpenSearch indices from the database.
 *
 * WHY THIS WAS REWRITTEN (2026-10-21, after the live Hostinger check):
 *   The previous version hard-coded `node: 'http://localhost:9200'` and
 *   `auth: { username: 'admin', password: 'admin' }`. On the production
 *   topology the OpenSearch service publishes NO host port and runs with the
 *   security plugin disabled, so that endpoint and those credentials are both
 *   wrong: the script could only ever run against a local OpenSearch. It also
 *   never created the indices, so the first run let OpenSearch auto-create them
 *   with DYNAMIC mappings — `name_suggest` became a plain object instead of a
 *   completion field, and no mapping existed for the fields the discover feed
 *   filters and sorts on.
 *
 * CONTRACT:
 *   - The endpoint comes from OPENSEARCH_URL (the same variable the API uses).
 *     When it is empty the script refuses to run: there is no safe default and
 *     no fabricated endpoint.
 *   - Credentials come from OPENSEARCH_USERNAME / OPENSEARCH_PASSWORD when the
 *     endpoint requires them; they are never defaulted and never printed.
 *   - Indices are created with EXPLICIT mappings when they do not exist. An
 *     existing index is never deleted or re-created implicitly: `--recreate` is
 *     required, and it is refused unless the caller also passes
 *     `--allow-destructive`.
 *   - Writes are idempotent: every document is upserted by its primary id, so a
 *     re-run converges rather than duplicating.
 *   - `--dry-run` performs the full database selection and reports exactly what
 *     WOULD be written, and touches nothing.
 *   - Bounded retries with backoff for transient failures.
 *   - `--prune` (explicit) removes index documents whose database record no
 *     longer exists or is no longer active. Without it, stale documents are
 *     reported but left in place — the API filters on `status` at query time.
 *
 * Usage:
 *   node scripts/reindex-products.js --dry-run
 *   node scripts/reindex-products.js --index products
 *   node scripts/reindex-products.js --recreate --allow-destructive
 *
 * Requires DATABASE_URL (Prisma) and OPENSEARCH_URL (OpenSearch) in the
 * environment. It never fabricates a seller, a product or a company: it indexes
 * what the database already holds.
 */
const path = require('path');

const OPENSEARCH_URL = (process.env.OPENSEARCH_URL || '').trim();
const OPENSEARCH_USERNAME = (process.env.OPENSEARCH_USERNAME || '').trim();
const OPENSEARCH_PASSWORD = (process.env.OPENSEARCH_PASSWORD || '');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};
const DRY_RUN = flag('--dry-run');
const RECREATE = flag('--recreate');
const ALLOW_DESTRUCTIVE = flag('--allow-destructive');
const PRUNE = flag('--prune');
const ONLY_INDEX = opt('--index');
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Explicit mappings. These are the fields the API's discover/search queries
// filter, sort and project on. A dynamic mapping would type several of them
// wrongly (e.g. `name_suggest` as an object instead of a completion field).
// ---------------------------------------------------------------------------
const MAPPINGS = {
  products: {
    settings: { number_of_shards: 1, number_of_replicas: 0, analysis: { analyzer: { tradingo_text: { type: 'custom', tokenizer: 'standard', filter: ['lowercase', 'asciifolding'] } } } },
    mappings: {
      properties: {
        id: { type: 'keyword' }, name: { type: 'text', analyzer: 'tradingo_text', fields: { keyword: { type: 'keyword' } } },
        slug: { type: 'keyword' }, shortDescription: { type: 'text', analyzer: 'tradingo_text' }, description: { type: 'text', analyzer: 'tradingo_text' },
        status: { type: 'keyword' }, productType: { type: 'keyword' }, brand: { type: 'keyword' }, model: { type: 'keyword' }, sku: { type: 'keyword' },
        unit: { type: 'keyword' }, currency: { type: 'keyword' }, moq: { type: 'float' }, minPrice: { type: 'float' }, maxPrice: { type: 'float' },
        isFeatured: { type: 'boolean' }, trustScoreSnapshot: { type: 'float' }, verificationLevel: { type: 'keyword' },
        companyId: { type: 'keyword' }, companyName: { type: 'text', analyzer: 'tradingo_text' }, companySlug: { type: 'keyword' }, businessType: { type: 'keyword' },
        categoryId: { type: 'keyword' }, categoryName: { type: 'text', analyzer: 'tradingo_text' },
        industryId: { type: 'keyword' }, industryName: { type: 'text', analyzer: 'tradingo_text' },
        city: { type: 'keyword' }, state: { type: 'keyword' }, country: { type: 'keyword' },
        location: { type: 'geo_point' },
        createdAt: { type: 'date' }, updatedAt: { type: 'date' },
        media: { type: 'nested', properties: { type: { type: 'keyword' }, url: { type: 'keyword', index: false } } },
        name_suggest: { type: 'completion' },
      },
    },
  },
  companies: {
    settings: { number_of_shards: 1, number_of_replicas: 0 },
    mappings: {
      properties: {
        id: { type: 'keyword' }, name: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
        slug: { type: 'keyword' }, description: { type: 'text' }, logo: { type: 'keyword', index: false }, banner: { type: 'keyword', index: false },
        businessType: { type: 'keyword' }, geographicReach: { type: 'keyword' },
        trustScore: { type: 'float' }, verificationLevel: { type: 'keyword' }, status: { type: 'keyword' },
        totalProducts: { type: 'integer' }, responseRate: { type: 'float' },
        city: { type: 'keyword' }, state: { type: 'keyword' }, country: { type: 'keyword' },
        createdAt: { type: 'date' }, updatedAt: { type: 'date' },
        name_suggest: { type: 'completion' },
      },
    },
  },
  categories: {
    settings: { number_of_shards: 1, number_of_replicas: 0 },
    mappings: {
      properties: {
        id: { type: 'keyword' }, name: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
        slug: { type: 'keyword' }, description: { type: 'text' }, icon: { type: 'keyword', index: false }, image: { type: 'keyword', index: false },
        parentId: { type: 'keyword' }, isActive: { type: 'boolean' }, sortOrder: { type: 'integer' }, productCount: { type: 'integer' },
        createdAt: { type: 'date' }, name_suggest: { type: 'completion' },
      },
    },
  },
  industries: {
    settings: { number_of_shards: 1, number_of_replicas: 0 },
    mappings: {
      properties: {
        id: { type: 'keyword' }, name: { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
        slug: { type: 'keyword' }, description: { type: 'text' }, icon: { type: 'keyword', index: false },
        createdAt: { type: 'date' }, name_suggest: { type: 'completion' },
      },
    },
  },
};

const INDICES = Object.keys(MAPPINGS);

function fail(msg) {
  console.error(`reindex: ERROR: ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
}

if (!OPENSEARCH_URL) {
  fail('OPENSEARCH_URL is not set. There is no safe default endpoint: set it to the OpenSearch service address (e.g. http://opensearch:9200).');
}
if (RECREATE && !ALLOW_DESTRUCTIVE) {
  fail('--recreate deletes and recreates an index. Re-run with --allow-destructive to confirm, and only during a maintenance window.');
}
if (ONLY_INDEX && !INDICES.includes(ONLY_INDEX)) {
  fail(`unknown --index '${ONLY_INDEX}' (known: ${INDICES.join(', ')})`);
}

const prismaPath = require.resolve('@prisma/client', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const opensearchPath = require.resolve('@opensearch-project/opensearch', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const { Client } = require(opensearchPath);
const { PrismaClient } = require(prismaPath);

const client = new Client({
  node: OPENSEARCH_URL,
  ...(OPENSEARCH_USERNAME ? { auth: { username: OPENSEARCH_USERNAME, password: OPENSEARCH_PASSWORD } } : {}),
});

const prisma = new PrismaClient();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Bounded retry with backoff for transient OpenSearch failures. */
async function withRetry(label, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`reindex: ${label} failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message} — retrying`);
        await sleep(500 * attempt);
      }
    }
  }
  throw lastErr;
}

async function ensureIndex(name) {
  const exists = (await client.indices.exists({ index: name })).body === true;
  if (exists) {
    if (RECREATE) {
      console.warn(`reindex: deleting and recreating index '${name}' (--recreate --allow-destructive)`);
      await withRetry(`delete ${name}`, () => client.indices.delete({ index: name }));
      await withRetry(`create ${name}`, () => client.indices.create({ index: name, body: MAPPINGS[name] }));
      return 'recreated';
    }
    return 'existing';
  }
  await withRetry(`create ${name}`, () => client.indices.create({ index: name, body: MAPPINGS[name] }));
  return 'created';
}

async function selectDocuments() {
  const selected = {};
  if (!ONLY_INDEX || ONLY_INDEX === 'products') {
    selected.products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true, industry: true, company: true, media: true },
    });
  }
  if (!ONLY_INDEX || ONLY_INDEX === 'companies') {
    selected.companies = await prisma.company.findMany({ where: { status: 'ACTIVE' } });
  }
  if (!ONLY_INDEX || ONLY_INDEX === 'categories') {
    selected.categories = await prisma.category.findMany({ where: { isActive: true } });
  }
  if (!ONLY_INDEX || ONLY_INDEX === 'industries') {
    selected.industries = await prisma.industry.findMany();
  }
  return selected;
}

function buildProductBody(p) {
  return {
    name: p.name, slug: p.slug, shortDescription: p.shortDescription, description: p.description,
    productType: p.productType, status: p.status, brand: p.brand, model: p.model, sku: p.sku,
    moq: p.moq, unit: p.unit, minPrice: p.minPrice ?? undefined, maxPrice: p.maxPrice ?? undefined,
    currency: p.currency, isFeatured: p.isFeatured || false,
    trustScoreSnapshot: p.company?.trustScore || 0, verificationLevel: p.company?.verificationLevel || 'LEVEL_0',
    companyId: p.companyId, companyName: p.company?.name || '', companySlug: p.company?.slug || '', businessType: p.company?.businessType || '',
    categoryId: p.categoryId, categoryName: p.category?.name || '', industryId: p.industryId, industryName: p.industry?.name || '',
    location: p.latitude && p.longitude ? { lat: p.latitude, lon: p.longitude } : undefined,
    city: p.city || '', state: p.state || '', country: p.country || '',
    createdAt: p.createdAt?.toISOString(), updatedAt: p.updatedAt?.toISOString(),
    media: p.media?.map((m) => ({ type: m.type, url: m.url })) || [],
    name_suggest: { input: [p.name] },
  };
}

function buildCompanyBody(c, prodCount) {
  return {
    id: c.id, name: c.name, slug: c.slug, description: c.description || '', logo: c.logo || '', banner: c.banner || '',
    businessType: c.businessType || '', geographicReach: c.geographicReach || '',
    trustScore: c.trustScore || 0, verificationLevel: c.verificationLevel || 'LEVEL_0', status: c.status,
    totalProducts: prodCount, responseRate: c.responseRate || 0,
    city: c.city || '', state: c.state || '', country: c.country || '',
    createdAt: c.createdAt?.toISOString(), updatedAt: c.updatedAt?.toISOString(),
    name_suggest: { input: [c.name] },
  };
}

function buildCategoryBody(c) {
  return {
    id: c.id, name: c.name, slug: c.slug, description: c.description || '', icon: c.icon || '', image: c.image || '',
    parentId: c.parentId, isActive: c.isActive, sortOrder: c.sortOrder || 0, productCount: c.productCount || 0,
    createdAt: c.createdAt?.toISOString(), name_suggest: { input: [c.name] },
  };
}

function buildIndustryBody(i) {
  return {
    id: i.id, name: i.name, slug: i.slug, description: i.description || '', icon: i.icon || '',
    createdAt: i.createdAt?.toISOString(), name_suggest: { input: [i.name] },
  };
}

async function main() {
  console.log(`reindex: target OpenSearch endpoint: ${OPENSEARCH_URL} (credentials: ${OPENSEARCH_USERNAME ? 'configured' : 'none'})`);
  console.log(`reindex: mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}${RECREATE ? ' + recreate' : ''}${PRUNE ? ' + prune' : ''}`);

  const selected = await selectDocuments();
  const plan = [];
  for (const name of Object.keys(selected)) plan.push([name, selected[name].length]);
  console.log('reindex: selected from the database:');
  for (const [name, count] of plan) console.log(`  ${name.padEnd(12)} ${count} document(s)`);

  if (DRY_RUN) {
    console.log('reindex: DRY RUN — nothing was written to OpenSearch.');
    console.log('reindex: the live catalogue size above is what the discover feed can contain. An empty or tiny catalogue cannot be fixed by indexing alone.');
    return;
  }

  const results = {};
  for (const name of Object.keys(selected)) {
    const state = await ensureIndex(name);
    console.log(`reindex: index '${name}' ${state}`);
    results[name] = { state, selected: selected[name].length, written: 0, failed: 0 };
  }

  for (const p of selected.products || []) {
    try {
      await withRetry(`index product ${p.id}`, () => client.index({ index: 'products', id: p.id, body: buildProductBody(p), refresh: false }));
      results.products.written++;
    } catch (err) { console.error(`reindex: product ${p.id} failed: ${err.message}`); results.products.failed++; }
  }
  for (const c of selected.companies || []) {
    const prodCount = await prisma.product.count({ where: { companyId: c.id, status: 'ACTIVE' } });
    try {
      await withRetry(`index company ${c.id}`, () => client.index({ index: 'companies', id: c.id, body: buildCompanyBody(c, prodCount), refresh: false }));
      results.companies.written++;
    } catch (err) { console.error(`reindex: company ${c.id} failed: ${err.message}`); results.companies.failed++; }
  }
  for (const c of selected.categories || []) {
    try {
      await withRetry(`index category ${c.id}`, () => client.index({ index: 'categories', id: c.id, body: buildCategoryBody(c), refresh: false }));
      results.categories.written++;
    } catch (err) { console.error(`reindex: category ${c.id} failed: ${err.message}`); results.categories.failed++; }
  }
  for (const i of selected.industries || []) {
    try {
      await withRetry(`index industry ${i.id}`, () => client.index({ index: 'industries', id: i.id, body: buildIndustryBody(i), refresh: false }));
      results.industries.written++;
    } catch (err) { console.error(`reindex: industry ${i.id} failed: ${err.message}`); results.industries.failed++; }
  }

  for (const name of Object.keys(results)) {
    await withRetry(`refresh ${name}`, () => client.indices.refresh({ index: name }));
    const count = await withRetry(`count ${name}`, () => client.count({ index: name }));
    results[name].indexed = count.body.count;
    console.log(`reindex: ${name}: selected=${results[name].selected} written=${results[name].written} failed=${results[name].failed} indexed_total=${count.body.count}`);
    if (results[name].failed > 0) process.exitCode = 1;
  }

  if (PRUNE) {
    for (const [name, docs] of Object.entries(selected)) {
      const live = new Set(docs.map((d) => String(d.id)));
      const existing = await withRetry(`scan ${name}`, async () => {
        const out = [];
        let after;
        let res;
        do {
          res = await client.search({ index: name, body: { query: { match_all: {} }, size: 1000, ...(after ? { search_after: after } : {}) } });
          out.push(...res.body.hits.hits);
          after = res.body.hits.hits.length ? res.body.hits.hits[res.body.hits.hits.length - 1].sort : undefined;
        } while (res.body.hits.hits.length === 1000);
        return out;
      });
      const stale = existing.filter((h) => !live.has(String(h._id)));
      for (const h of stale) {
        await withRetry(`delete ${name}/${h._id}`, () => client.delete({ index: name, id: h._id, refresh: false }));
      }
      console.log(`reindex: ${name}: pruned ${stale.length} stale document(s)`);
    }
  } else {
    console.log('reindex: stale documents were NOT removed (pass --prune to remove them). The API filters on status at query time, so inactive records are not served.');
  }
}

main()
  .catch((err) => { console.error(`reindex: FAILED: ${err.message}`); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
