import { PrismaClient } from '@prisma/client';

const ENDPOINT = 'http://localhost:9200';
const INDEX = 'catalog';
const BATCH = 1000;

async function scrollAll(entityType: string): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const init = await fetch(`${ENDPOINT}/${INDEX}/_search?scroll=2m`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: BATCH,
      track_total_hits: true,
      query: { term: { entityType } },
      _source: true,
    }),
  });
  const first: any = await init.json();
  const total = first.hits.total.value as number;
  let scrollId = first._scroll_id as string;
  for (const hit of first.hits.hits as any[]) {
    map.set(hit._source.id, hit._source);
  }
  while (map.size < total) {
    const resp = await fetch(`${ENDPOINT}/_search/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scroll: '2m', scroll_id: scrollId }),
    });
    const body: any = await resp.json();
    scrollId = body._scroll_id as string;
    for (const hit of body.hits.hits as any[]) {
      map.set(hit._source.id, hit._source);
    }
  }
  await fetch(`${ENDPOINT}/_search/scroll`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scroll_id: scrollId }),
  });
  return map;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  let totalMismatches = 0;

  const entities: { entity: string; field: string }[] = [
    { entity: 'PRODUCT_MASTER', field: 'hsCode' },
    { entity: 'SERVICE_MASTER', field: 'sacCode' },
  ];

  for (const { entity, field } of entities) {
    const osMap = await scrollAll(entity);
    const ids = [...osMap.keys()];

    const dbRows =
      entity === 'PRODUCT_MASTER'
        ? await prisma.productMaster.findMany({ where: { id: { in: ids } }, select: { id: true, hsCode: true } })
        : await prisma.serviceMaster.findMany({ where: { id: { in: ids } }, select: { id: true, sacCode: true } });
    const dbMap = new Map<string, any>();
    for (const r of dbRows) dbMap.set(r.id, (r as any)[field]);

    let mismatches = 0;
    const samples: string[] = [];
    for (const [id, osDoc] of osMap) {
      const osVal = osDoc[field] ?? null;
      const dbVal = dbMap.get(id) ?? null;
      if (osVal !== dbVal) {
        mismatches++;
        if (samples.length < 5) samples.push(`${id}: os=${osVal ?? 'null'} db=${dbVal ?? 'null'}`);
      }
    }
    totalMismatches += mismatches;
    console.log(
      `${entity}: osDocs=${osMap.size} dbRows=${dbRows.length} mismatches=${mismatches}`,
      samples.length ? `samples: ${samples.join(' | ')}` : '',
    );
  }

  console.log(`TOTAL mismatches: ${totalMismatches}`);
  await prisma.$disconnect();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
