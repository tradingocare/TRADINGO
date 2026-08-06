P-2.3 — Mapping Coverage Run (instructions)

Purpose
-------
Produce a mapping coverage report that measures how many legacy marketplace categories map exactly to Master Catalog categories (slug/name heuristic).

Prereqs
-------
- Local/staging DB with Catalog and legacy Category data populated
- API server running (optional) OR Node environment with direct Prisma access
- Admin JWT (if calling API endpoint)

Methods
-------
1) API endpoint (recommended when server running)
   - Endpoint: GET /marketplace-catalog-bridge/coverage
   - Guards: ADMIN/SUPER_ADMIN
   - Sample:
     curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/marketplace-catalog-bridge/coverage

2) Direct Node script (run from repo root)
   - Create a short script that imports Prisma and calls the adapter helpers:

   ```js
   // scripts/run-mapping-coverage.js
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   async function run() {
     const old = await prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true } });
     const catalog = await prisma.catalogCategory.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true } });
     const catalogBySlug = new Map(catalog.map(c => [c.slug, c]));
     const mapped = old.filter(o => catalogBySlug.has(o.slug));
     console.log({ totalOld: old.length, totalCatalog: catalog.length, mappedCount: mapped.length, coverage: (mapped.length/old.length)*100 });
     await prisma.$disconnect();
   }
   run().catch(e => { console.error(e); process.exit(1); });
   ```

   - Run:
   ```powershell
   node scripts/run-mapping-coverage.js
   ```

Output
------
Produce JSON with: totalOld, totalCatalog, mappedCount, unmappedOldCount, unmappedCatalogCount, coverage (%), and sampled examples.

Notes
-----
- This run implements exact-slug matching only. For fuzzy mapping (name heuristics), run the Adapter `validateMapping` or `computeNameMatch` heuristics for additional candidates and confidence scores.
