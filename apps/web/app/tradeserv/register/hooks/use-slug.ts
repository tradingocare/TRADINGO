'use client';

const SLUG_KEY = 'tradeserv-reserved-slug';

function generateRandomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const suffix = generateRandomSuffix();
  return `${base}-${suffix}`;
}

export function generateCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function reserveSlug(slug: string, categorySlug: string): void {
  try {
    localStorage.setItem(SLUG_KEY, JSON.stringify({ slug, categorySlug, reservedAt: new Date().toISOString() }));
  } catch {
    /* storage unavailable */
  }
}

export function getReservedSlug(): { slug: string; categorySlug: string } | null {
  try {
    const raw = localStorage.getItem(SLUG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
