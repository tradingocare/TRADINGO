import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * PRIORITY C — Deep Audit candidate: an invalid subcategory URL must produce
 * a REAL 404, not a streamed soft-404 (200 + "Subcategory Not Found").
 *
 * Source-level contract (no network): the existence check has to run in the
 * page body BEFORE the Suspense boundary that streams the listing shell.
 * While a fallback streams, the response is already committed to 200, so any
 * late notFound() can only swap the UI — never the status code.
 */
const web = process.cwd().replace(/[\\/]apps[\\/]web$/, '');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

const page = read('apps/web/app/categories/[slug]/[subcategory]/page.tsx');
const pageBody = page.slice(
  page.indexOf('export default async function SubcategoryPage'),
  page.indexOf('async function SubcategoryContent'),
);
const contentFn = page.slice(page.indexOf('async function SubcategoryContent'));

describe('PRIORITY C — invalid subcategory returns a pre-stream 404', () => {
  it('1. page body resolves the subcategory before rendering anything', () => {
    expect(pageBody).toMatch(
      /const resolved = await resolveSubcategory\(categorySlug, subSlug\)/,
    );
    expect(pageBody).toMatch(/if \(!resolved\) notFound\(\);/);
  });

  it('2. the 404 check precedes the streaming Suspense boundary', () => {
    const checkAt = pageBody.indexOf('if (!resolved) notFound();');
    const suspenseAt = pageBody.indexOf('<Suspense');
    expect(checkAt).toBeGreaterThan(-1);
    expect(suspenseAt).toBeGreaterThan(-1);
    expect(checkAt).toBeLessThan(suspenseAt);
  });

  it('3. content consumes resolved data — no duplicate fetch, no late notFound()', () => {
    expect(contentFn).not.toMatch(/notFound\(\)/);
    expect(contentFn).not.toMatch(/await resolveSubcategory\(/);
    expect(pageBody).toMatch(/<SubcategoryContent resolved=\{resolved\}/);
  });

  it('4. unresolved metadata is not indexable and not cross-canonical', () => {
    expect(page).toMatch(
      /if \(!resolved\) \{[\s\S]{0,300}robots: ROBOTS_NOINDEX_FOLLOW/,
    );
    expect(page).toMatch(
      /if \(!resolved\) \{[\s\S]{0,300}alternates: \{ canonical \}/,
    );
  });
});
