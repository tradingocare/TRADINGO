import { randomUUID } from 'crypto';
import { NearMeService, type NearMeQuery } from '../near-me.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * CI-05 — NearMe searchProducts sort-path proof (P2022 regression guard).
 *
 * The outer SELECT reads FROM filtered f, so ORDER BY fragments must
 * reference f.* (or the bare `distance` CTE output) — never the inner
 * `pli` alias, which is out of scope and raises:
 *   missing FROM-clause entry for table "pli"
 *
 * These tests execute the real SQL and therefore require a PostgreSQL
 * database with the committed migrations applied:
 *   TEST_DATABASE_URL=postgresql://... jest near-me-sort-paths
 * Without TEST_DATABASE_URL every test skips (unit CI stays green).
 *
 * Setup/teardown use raw SQL with explicit base columns so the fixture is
 * immune to client/schema drift in either direction; only the service's
 * own explicit-column query is under test.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || '';
const itDb = TEST_DATABASE_URL ? it : it.skip;

describe('NearMeService searchProducts sort paths (live SQL)', () => {
  let prisma: PrismaService;
  let service: NearMeService;
  let companyId = '';
  let productId = '';
  const sfx = Date.now().toString(36);

  beforeAll(async () => {
    if (!TEST_DATABASE_URL) return;
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    prisma = new PrismaService();
    await prisma.$connect();
    service = new NearMeService(prisma);

    companyId = randomUUID();
    productId = randomUUID();
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "Company" (id, name, slug, "createdBy", "updatedAt")
      VALUES (${companyId}, ${`Sort Co ${sfx}`}, ${`sort-co-${sfx}`}, 'ci05-sql-test', ${now})`;
    await prisma.$executeRaw`
      INSERT INTO "Product" (id, "companyId", name, slug, "createdBy", "updatedAt")
      VALUES (${productId}, ${companyId}, ${`Sort Widget ${sfx}`}, ${`sort-widget-${sfx}`}, 'ci05-sql-test', ${now})`;
    await prisma.$executeRaw`
      INSERT INTO "ProductLocationIndex"
        (id, "productId", "companyId", latitude, longitude, "visibilityRadius", status, "updatedAt")
      VALUES (${randomUUID()}, ${productId}, ${companyId}, 19.08, 72.88, 'PAN_INDIA', 'ACTIVE', ${now})`;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$executeRaw`DELETE FROM "ProductLocationIndex" WHERE "productId" = ${productId}`;
    await prisma.$executeRaw`DELETE FROM "Product" WHERE id = ${productId}`;
    await prisma.$executeRaw`DELETE FROM "Company" WHERE id = ${companyId}`;
    await prisma.$disconnect();
  });

  const baseQuery: NearMeQuery = {
    lat: 19.076,
    lng: 72.8777,
    radiusKm: 50,
    page: 1,
    limit: 10,
  };

  itDb.each([
    ['distance'],
    ['trust'],
    ['price_asc'],
    ['price_desc'],
    ['trending'],
    ['delivery'],
  ] as const)('sort=%s executes without missing-FROM-clause error', async (sort) => {
    let result;
    try {
      result = await service.searchProducts({ ...baseQuery, sort });
    } catch (err) {
      expect(String((err as Error)?.message || err)).not.toMatch(/missing FROM-clause entry for table "pli"/);
      throw err;
    }
    expect(result.meta.total).toBeGreaterThanOrEqual(1);
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data.some((p: any) => p.productId === productId)).toBe(true);
  });
});
