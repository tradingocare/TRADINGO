/**
 * DD-01 services redistribution map (founder-locked).
 *
 * Four workbook subcategories parented under the generic `Services` category
 * are re-parented to their verified counterpart categories at import time:
 *   Services / Legal Services       → Legal Services        (exact name match)
 *   Services / Financial Services   → Financial Services    (exact name match)
 *   Services / Consulting Services  → Consultancy Services  (founder-approved near match)
 *   Services / Marketing Services   → Digital Marketing     (founder-approved near match)
 *
 * The six remaining `Services` subcategories (Creative/IT/Professional/
 * Support/Technical/Training Services — 126 rows) are PRESERVED under
 * `Services` untouched and listed in the review artifact. NEVER deleted.
 *
 * Keys are `category.toLowerCase() + '|||' + subcategory.toLowerCase()`.
 * Lookup is pure + deterministic. Unknown pairs pass through unchanged.
 */

const REDISTRIBUTION: Record<string, string> = {
  'services|||legal services': 'Legal Services',
  'services|||financial services': 'Financial Services',
  'services|||consulting services': 'Consultancy Services',
  'services|||marketing services': 'Digital Marketing',
};

export interface Redistribution {
  /** The category name to resolve the parent from (may equal the input). */
  category: string;
  /** True when the parent differs from the workbook's stated parent. */
  redirected: boolean;
  /** Human-readable trace for the manifest. Null when not redirected. */
  trace: string | null;
}

/** Resolve the effective parent category for a (category, subcategory) pair. */
export function resolveSubcategoryParent(category: string, subCategory: string): Redistribution {
  const key = `${(category || '').trim().toLowerCase()}|||${(subCategory || '').trim().toLowerCase()}`;
  const target = REDISTRIBUTION[key];
  if (!target || target.toLowerCase() === (category || '').trim().toLowerCase()) {
    return { category, redirected: false, trace: null };
  }
  return {
    category: target,
    redirected: true,
    trace: `DD-01 redistribute: (${category} / ${subCategory}) parented under "${target}"`,
  };
}

/** The six preserved-unmatched subcategory names (for review-artifact + tests). */
export const PRESERVED_SERVICES_SUBCATEGORIES = [
  'Creative Services',
  'IT Services',
  'Professional Services',
  'Support Services',
  'Technical Services',
  'Training Services',
] as const;
