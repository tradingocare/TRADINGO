/**
 * Deterministic slug utilities for catalog import (DD-05, founder-locked).
 *
 * Design rules (all proven by unit tests in deterministic-slug.spec.ts):
 *  1. PURE functions — same input always yields the same output. No randomness
 *     (no uuid), no clock, no machine state. Reruns across environments agree.
 *  2. SHAPE-COMPATIBLE with every slug the previous naive implementation ever
 *     produced for ASCII names (`lowercase → [^a-z0-9]+ → '-'`), so existing
 *     clean slugs (e.g. `steel-metals`) keep resolving.
 *  3. UNICODE-SAFE via NFKD diacritic stripping (deterministic, no locale).
 *  4. NO transliteration map — the Phase-6B bug class (unescaped regex built
 *     from map keys, which injected `or` everywhere) is structurally
 *     impossible here because no regex is ever constructed from data.
 *  5. COLLISIONS resolve monotonically (`-2`, `-3`, …) in first-seen input
 *     order via {@link SlugAssigner}. Callers MUST assign the whole batch in
 *     stable (S.No) order BEFORE concurrent DB writes.
 */

/** Lowercase ASCII slug core shared by every catalog level. */
export function slugifyDeterministic(name: string): string {
  const normalized = (name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'item';
}

/**
 * Monotonic collision resolver. First-seen name keeps the base slug;
 * later names that slugify identically receive `-2`, `-3`, … in first-seen
 * order. Scope one instance per uniqueness scope:
 *  - global `@unique` slugs (Category, CatalogCategory, CatalogItem,
 *    ProductMaster, ServiceMaster) → ONE instance per import run;
 *  - scoped `@@unique([categoryId, slug])` (CatalogSubcategory) → ONE
 *    instance PER PARENT.
 */
export class SlugAssigner {
  private readonly seen = new Map<string, number>();

  assign(name: string): { slug: string; suffixed: boolean; attempt: number } {
    const base = slugifyDeterministic(name);
    const count = this.seen.get(base) ?? 0;
    this.seen.set(base, count + 1);
    if (count === 0) return { slug: base, suffixed: false, attempt: 0 };
    return { slug: `${base}-${count + 1}`, suffixed: true, attempt: count + 1 };
  }

  /** How many distinct base slugs have been assigned (diagnostics). */
  get size(): number {
    return this.seen.size;
  }
}
