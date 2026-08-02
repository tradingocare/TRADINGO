const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const tables = await p.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%Company%' OR table_name LIKE '%Owner%' ORDER BY table_name`);
  console.log('Tables:', JSON.stringify(tables, null, 2));
  
  // Try to find the relation
  for (const t of tables) {
    try {
      const rows = await p.$queryRawUnsafe(`SELECT * FROM "${t.table_name}" LIMIT 5`);
      console.log(`\n${t.table_name}:`, JSON.stringify(rows, null, 2));
    } catch(e) {}
  }

  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); });
