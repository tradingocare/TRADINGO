const { PrismaClient } = require('@prisma/client');
const bcrypt = require('E:\\tradingo\\node_modules\\.pnpm\\bcrypt@5.1.1\\node_modules\\bcrypt');
const p = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Test@1234', 10);
  
  await p.user.update({ where: { email: 'seller@test.com' }, data: { passwordHash: hash } });
  console.log('Updated seller@test.com password');
  
  await p.user.update({ where: { email: 'buyer@test.com' }, data: { passwordHash: hash } });
  console.log('Updated buyer@test.com password');
  
  // Add seller2 as owner of cmp-seller-001
  const seller2 = await p.user.findUnique({ where: { email: 'seller2@tradingo.com' } });
  await p.$executeRawUnsafe(
    'INSERT INTO "CompanyOwner" (id, "companyId", "userId", "isPrimary", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING',
    `co-s2-${Date.now()}`, 'cmp-seller-001', seller2.id, false
  );
  console.log('Added seller2 as owner of cmp-seller-001');
  
  // Add newtest as owner of cmp-buyer-001
  const newtest = await p.user.findUnique({ where: { email: 'newtest@tradingo.com' } });
  await p.$executeRawUnsafe(
    'INSERT INTO "CompanyOwner" (id, "companyId", "userId", "isPrimary", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING',
    `co-nt-${Date.now()}`, 'cmp-buyer-001', newtest.id, false
  );
  console.log('Added newtest as owner of cmp-buyer-001');
  
  // Verify
  const owners = await p.$queryRawUnsafe('SELECT id, "companyId", "userId", "isPrimary" FROM "CompanyOwner"');
  console.log('Owners:', JSON.stringify(owners, null, 2));
  
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
