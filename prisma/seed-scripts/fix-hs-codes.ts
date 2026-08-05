import { PrismaClient } from '@prisma/client';
import { INDUSTRIES } from '../seed-data/master-directory.data';

const prisma = new PrismaClient();
const BATCH = 1000;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function hashDigits(input: string, len: number): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const abs = Math.abs(h) % 1000000;
  return String(abs).padStart(len, '0');
}

async function main(): Promise<void> {
  const industries = await prisma.industry.findMany({ select: { id: true, name: true } });
  const chapterByIndustryName = new Map(INDUSTRIES.map((i) => [i.name, i.hsnChapter]));
  const chapterById = new Map<string, string>();
  for (const ind of industries) chapterById.set(ind.id, chapterByIndustryName.get(ind.name) || '84');

  const mappings = await prisma.catalogIndustryMapping.findMany({ select: { catalogCategoryId: true, industryId: true } });
  const chapterByCat = new Map<string, string>();
  for (const m of mappings) chapterByCat.set(m.catalogCategoryId, chapterById.get(m.industryId) || '84');

  const subcats = await prisma.catalogSubcategory.findMany({ select: { id: true, categoryId: true } });
  const catOfSub = new Map(subcats.map((s) => [s.id, s.categoryId]));

  const all = await prisma.catalogItem.findMany({
    select: { id: true, slug: true, subcategoryId: true, hsCode: true },
    where: { type: 'Product' },
  });
  const bad = all.filter((i) => !i.hsCode || !/^[0-9]{8}$/.test(i.hsCode));
  console.log(`bad product hsCodes found: ${bad.length}`);

  let fixed = 0;
  const skipped: string[] = [];
  for (let i = 0; i < bad.length; i += BATCH) {
    const chunk = bad.slice(i, i + BATCH);
    const updates: { id: string; hsCode: string }[] = [];
    const masterUpdates: { slug: string; hsCode: string }[] = [];
    for (const item of chunk) {
      const catId = catOfSub.get(item.subcategoryId);
      if (!catId) {
        skipped.push(item.slug);
        continue;
      }
      const chapter = chapterByCat.get(catId) || '84';
      const hsCode = chapter + hashDigits(item.slug, 6);
      updates.push({ id: item.id, hsCode });
      masterUpdates.push({ slug: 'pm-' + item.slug, hsCode });
    }
    for (const u of updates) {
      await prisma.catalogItem.update({ where: { id: u.id }, data: { hsCode: u.hsCode } });
    }
    for (const mu of masterUpdates) {
      await prisma.productMaster.updateMany({ where: { slug: mu.slug }, data: { hsCode: mu.hsCode } });
    }
    fixed += updates.length;
    console.log(`  fixed ${updates.length} (total ${fixed})`);
  }

  const remaining = all.filter((i) => !i.hsCode || !/^[0-9]{8}$/.test(i.hsCode)).length;
  console.log(`fixed: ${fixed}, remaining bad: ${remaining}, skipped: ${skipped.length}`);
  if (skipped.length) console.log('skipped:', skipped.slice(0, 10));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
