import { ImportJobStatus, ImportRowStatus } from '@prisma/client';
import * as fs from 'fs';

export interface CsvRow {
  serialNo: number;
  category: string;
  subCategory: string;
  name: string;
  type: 'Product' | 'Service';
  unit: string;
  altUnits: string;
  quantityParams: string;
}

export interface SeedResult {
  jobId: string;
  status: ImportJobStatus;
  imported: number;
  duplicate: number;
  skipped: number;
  error: number;
  errors: string[];
  summary: Record<string, unknown>;
}

export interface ImportJobRowInsert {
  importJobId: string;
  rowNumber: number;
  status: ImportRowStatus;
  entityType: string;
  entityId?: string;
  rawData?: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function parseCsv(filePath: string): {
  rows: CsvRow[];
  categories: string[];
  subcategoryMap: Map<string, Set<string>>;
} {
  const content = fs.readFileSync(filePath).toString('utf-8');
  const lines = content.split('\n');

  if (lines.length < 2) {
    return { rows: [], categories: [], subcategoryMap: new Map() };
  }

  const rows: CsvRow[] = [];
  const categorySet = new Set<string>();
  const subcategoryMap = new Map<string, Set<string>>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;

    const serialNo = parseInt(cols[0], 10) || 0;
    const category = cols[1].trim();
    const subCategory = cols[2].trim();
    const name = cols[3].trim();
    const typeRaw = cols[4].trim();
    const unit = (cols[5] || '').trim();
    const altUnits = (cols[6] || '').trim();
    const quantityParams = (cols[7] || '').trim();

    if (!name || !category) continue;
    if (typeRaw !== 'Product' && typeRaw !== 'Service') continue;

    rows.push({
      serialNo,
      category,
      subCategory,
      name,
      type: typeRaw as 'Product' | 'Service',
      unit,
      altUnits,
      quantityParams,
    });

    categorySet.add(category);
    if (!subcategoryMap.has(category)) subcategoryMap.set(category, new Set());
    if (subCategory) subcategoryMap.get(category)!.add(subCategory);
  }

  return {
    rows,
    categories: [...categorySet],
    subcategoryMap,
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

export function generateUniqueSlug(name: string, existingSlugs: Set<string>): string {
  const baseSlug = slugify(name);
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let counter = 2;
  let slug: string;
  do {
    slug = `${baseSlug}-${counter}`;
    counter++;
  } while (existingSlugs.has(slug));
  return slug;
}

export function generateKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);
}

export const BATCH_SIZE = 100;

export function logProgress(
  entityType: string,
  current: number,
  total: number,
  imported: number,
  duplicate: number,
  error: number,
): void {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  console.log(
    `[${entityType}] ${current}/${total} (${pct}%) | imported: ${imported} | duplicate: ${duplicate} | errors: ${error}`,
  );
}

export function createJobRow(
  jobId: string,
  rowNumber: number,
  status: ImportRowStatus,
  entityType: string,
  entityId?: string,
  rawData?: Record<string, unknown>,
  errors?: string[],
): ImportJobRowInsert {
  return {
    importJobId: jobId,
    rowNumber,
    status,
    entityType,
    entityId,
    rawData,
    errors: errors || [],
    warnings: [],
  };
}
