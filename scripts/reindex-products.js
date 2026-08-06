const path = require('path');
const prismaPath = require.resolve('@prisma/client', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const opensearchPath = require.resolve('@opensearch-project/opensearch', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const { Client } = require(opensearchPath);
const { PrismaClient } = require(prismaPath);

const prisma = new PrismaClient();
const client = new Client({
  node: 'http://localhost:9200',
  auth: { username: 'admin', password: 'admin' },
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // Reindex products
  console.log('Reindexing products...');
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true, industry: true, company: true, media: true },
  });
  for (const product of products) {
    const body = {
      name: product.name, slug: product.slug,
      shortDescription: product.shortDescription, description: product.description,
      productType: product.productType, status: product.status,
      brand: product.brand, model: product.model, sku: product.sku,
      moq: product.moq, unit: product.unit,
      minPrice: product.minPrice || undefined, maxPrice: product.maxPrice || undefined,
      currency: product.currency, isFeatured: product.isFeatured || false,
      trustScoreSnapshot: product.company?.trustScore || 0,
      verificationLevel: product.company?.verificationLevel || 'LEVEL_0',
      companyId: product.companyId, companyName: product.company?.name || '',
      companySlug: product.company?.slug || '',
      businessType: product.company?.businessType || '',
      categoryId: product.categoryId, categoryName: product.category?.name || '',
      industryId: product.industryId, industryName: product.industry?.name || '',
      location: product.latitude && product.longitude ? { lat: product.latitude, lon: product.longitude } : undefined,
      city: product.city || '', state: product.state || '', country: product.country || '',
      createdAt: product.createdAt?.toISOString(), updatedAt: product.updatedAt?.toISOString(),
      media: product.media?.map(m => ({ type: m.type, url: m.url })) || [],
      name_suggest: { input: [product.name] },
    };
    try { await client.index({ index: 'products', id: product.id, body, refresh: false }); }
    catch (err) { console.error(`Product ${product.id}: ${err.message}`); }
  }
  console.log(`Indexed ${products.length} products`);

  // Reindex companies
  console.log('Reindexing companies...');
  const companies = await prisma.company.findMany({ where: { status: 'ACTIVE' } });
  for (const company of companies) {
    const prodCount = await prisma.product.count({ where: { companyId: company.id, status: 'ACTIVE' } });
    const body = {
      id: company.id, name: company.name, slug: company.slug,
      description: company.description || '', logo: company.logo || '', banner: company.banner || '',
      businessType: company.businessType || '', geographicReach: company.geographicReach || '',
      trustScore: company.trustScore || 0, verificationLevel: company.verificationLevel || 'LEVEL_0',
      status: company.status, totalProducts: prodCount, responseRate: company.responseRate || 0,
      city: company.city || '', state: company.state || '', country: company.country || '',
      createdAt: company.createdAt?.toISOString(), updatedAt: company.updatedAt?.toISOString(),
      name_suggest: { input: [company.name] },
    };
    try { await client.index({ index: 'companies', id: company.id, body, refresh: false }); }
    catch (err) { console.error(`Company ${company.id}: ${err.message}`); }
  }
  console.log(`Indexed ${companies.length} companies`);

  // Reindex categories
  console.log('Reindexing categories...');
  const categories = await prisma.category.findMany({ where: { isActive: true } });
  for (const cat of categories) {
    const body = {
      id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || '',
      icon: cat.icon || '', image: cat.image || '', parentId: cat.parentId,
      isActive: cat.isActive, sortOrder: cat.sortOrder || 0, productCount: cat.productCount || 0,
      createdAt: cat.createdAt?.toISOString(),
      name_suggest: { input: [cat.name] },
    };
    try { await client.index({ index: 'categories', id: cat.id, body, refresh: false }); }
    catch (err) { console.error(`Category ${cat.id}: ${err.message}`); }
  }
  console.log(`Indexed ${categories.length} categories`);

  // Reindex industries
  console.log('Reindexing industries...');
  const industries = await prisma.industry.findMany();
  for (const ind of industries) {
    const body = {
      id: ind.id, name: ind.name, slug: ind.slug, description: ind.description || '',
      icon: ind.icon || '', createdAt: ind.createdAt?.toISOString(),
      name_suggest: { input: [ind.name] },
    };
    try { await client.index({ index: 'industries', id: ind.id, body, refresh: false }); }
    catch (err) { console.error(`Industry ${ind.id}: ${err.message}`); }
  }
  console.log(`Indexed ${industries.length} industries`);

  // Refresh all
  await Promise.all([
    client.indices.refresh({ index: 'products' }),
    client.indices.refresh({ index: 'companies' }),
    client.indices.refresh({ index: 'categories' }),
    client.indices.refresh({ index: 'industries' }),
  ]);
  console.log('All indices refreshed');
}

main().catch(console.error).finally(() => prisma.$disconnect());
