const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  console.log('=== USERS ===');
  const users = await p.user.findMany({ select: { id: true, email: true, role: true } });
  console.log(JSON.stringify(users, null, 2));
  
  console.log('\n=== COMPANIES ===');
  const companies = await p.company.findMany({ select: { id: true, name: true, slug: true, subscriptionPlan: true, ownerId: true } });
  console.log(JSON.stringify(companies, null, 2));
  
  console.log('\n=== COMPANY MEMBERS ===');
  try {
    const members = await p.$queryRawUnsafe('SELECT "companyId", "userId", role FROM "CompanyMember"');
    console.log(JSON.stringify(members, null, 2));
  } catch(e) { console.log('No CompanyMember table:', e.message); }

  console.log('\n=== PRODUCTS ===');
  try {
    const products = await p.product.findMany({ select: { id: true, name: true, status: true, companyId: true } });
    console.log(JSON.stringify(products, null, 2));
  } catch(e) { console.log('No products:', e.message); }
  
  console.log('\n=== CATEGORIES (first 5) ===');
  const cats = await p.category.findMany({ select: { id: true, name: true, parentId: true }, take: 5 });
  console.log(JSON.stringify(cats, null, 2));

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
