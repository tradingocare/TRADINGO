/**
 * Hybrid unit normalization table (DD-04, founder-locked: HYBRID).
 *
 * Only VERIFIED equivalents are mapped. Everything else passes through
 * verbatim and becomes its own `CatalogUnit` row — genuinely distinct
 * billing/frequency tokens (Per Filing, Credit, License, …) must never be
 * coerced into a physical unit they are not.
 *
 * Keys are lowercased+trimmed source strings. Each entry records WHY so the
 * import manifest (and any reviewer) can audit every applied mapping.
 * Unmapped sources are NOT errors — they fall through verbatim.
 */

export interface UnitMapping {
  canonical: string;
  reason: string;
}

const TABLE: Record<string, UnitMapping> = {
  kg: { canonical: 'Kilogram', reason: 'SI abbreviation expansion (DB canonical: Kilogram)' },
  ton: { canonical: 'Tonne', reason: 'Trade spelling normalization (DB canonical: Tonne)' },
  mt: { canonical: 'Metric Ton', reason: 'Abbreviation expansion (DB canonical: Metric Ton)' },
  unit: { canonical: 'Units', reason: 'Plural canonical form (DB canonical: Units)' },
  sqft: { canonical: 'Square Feet', reason: 'Abbreviation expansion (DB canonical: Square Feet)' },
  sqmt: { canonical: 'Square Metre', reason: 'Abbreviation expansion (DB canonical: Square Metre)' },
  meter: { canonical: 'Metre', reason: 'Indian-English spelling (DB canonical: Metre)' },
};

export interface NormalizedUnit {
  /** Value to store on the item + dictionary row to ensure. */
  canonical: string;
  /** True when the stored value differs from the source string. */
  transformed: boolean;
  /** Human-readable reason (mapping reason, or 'verbatim distinct unit'). */
  reason: string;
}

/** Normalize one unit string. Pure + deterministic. Never throws. */
export function normalizeUnit(value: string | null | undefined): NormalizedUnit {
  const raw = (value || '').trim();
  if (!raw) return { canonical: '', transformed: false, reason: 'empty' };
  const hit = TABLE[raw.toLowerCase()];
  if (hit) return { canonical: hit.canonical, transformed: hit.canonical !== raw, reason: hit.reason };
  return { canonical: raw, transformed: false, reason: 'verbatim distinct unit (preserved per DD-04)' };
}

/** All canonical names this table can produce (for dictionary pre-seeding/E2E assertions). */
export function normalizedUnitValues(): string[] {
  return [...new Set(Object.values(TABLE).map((m) => m.canonical))].sort();
}
