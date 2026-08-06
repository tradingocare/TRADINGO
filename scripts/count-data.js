const path = require('path');
const prismaPath = require.resolve('@prisma/client', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const opensearchPath = require.resolve('@opensearch-project/opensearch', { paths: [path.resolve(__dirname, '..', 'apps', 'api')] });
const { PrismaClient } = require(prismaPath);
const p = new PrismaClient();
Promise.all([
  p.product.count({ where: { status: 'ACTIVE' } }),
  p.company.count({ where: { status: 'ACTIVE' } }),
  p.category.count({ where: { isActive: true } }),
  p.industry.count(),
]).then(([prods, comps, cats, inds]) => {
  console.log({ activeProducts: prods, activeCompanies: comps, activeCategories: cats, activeIndustries: inds });
}).finally(() => p.$disconnect());
