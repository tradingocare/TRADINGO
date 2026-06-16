export function computeChecksum(data: Record<string, unknown>): string {
  const keys = Object.keys(data).sort();
  const parts = keys.map((k) => `${k}:${JSON.stringify(data[k])}`);
  const str = parts.join('|');

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const md5like = Math.abs(hash).toString(16).padStart(8, '0');
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const fnv = (h >>> 0).toString(16).padStart(8, '0');

  return `${md5like}${fnv}`;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getTerms(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'grade', 'type', 'size',
  'made', 'new', 'best', 'high', 'top', 'super', 'ultra', 'premium',
  'quality', 'standard', 'industrial', 'commercial',
]);

function getSignificantTerms(name: string): Set<string> {
  const terms = getTerms(name);
  for (const sw of STOP_WORDS) terms.delete(sw);
  return terms;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  existingId?: string;
  confidence: number;
}

export function buildExistingIndex(
  records: Array<{ name: string; categoryId: string; id: string }>
): Map<string, string> {
  const index = new Map<string, string>();
  for (const record of records) {
    const key = `${normalizeName(record.name)}|||${record.categoryId}`;
    index.set(key, record.id);
  }
  return index;
}

export function detectDuplicate(
  name: string,
  categoryId: string,
  existing: Map<string, string>
): DuplicateResult {
  const normalized = normalizeName(name);
  const exactKey = `${normalized}|||${categoryId}`;

  if (existing.has(exactKey)) {
    return {
      isDuplicate: true,
      existingId: existing.get(exactKey),
      confidence: 1.0,
    };
  }

  const inTerms = getSignificantTerms(normalized);
  if (inTerms.size === 0) {
    return { isDuplicate: false, confidence: 0.0 };
  }

  let bestMatch: { id: string; distance: number; overlap: number } | null = null;

  for (const [key, id] of existing) {
    const [existingName, existingCategory] = key.split('|||');

    if (existingCategory !== categoryId) continue;

    const dist = levenshteinDistance(normalized, existingName);

    if (dist < 3) {
      const confidence = Math.max(0.5, 1.0 - dist / 10);
      if (!bestMatch || dist < bestMatch.distance) {
        bestMatch = { id, distance: dist, overlap: confidence };
      }
      continue;
    }

    if (dist < 5) {
      const exTerms = getSignificantTerms(existingName);
      const common = new Set([...inTerms].filter((t) => exTerms.has(t)));
      const overlap = (common.size * 2) / (inTerms.size + exTerms.size);
      if (overlap > 0.6) {
        const confidence = Math.min(0.9, overlap);
        if (!bestMatch || confidence > bestMatch.overlap) {
          bestMatch = { id, distance: dist, overlap: confidence };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      isDuplicate: true,
      existingId: bestMatch.id,
      confidence: bestMatch.overlap,
    };
  }

  return { isDuplicate: false, confidence: 0.0 };
}
