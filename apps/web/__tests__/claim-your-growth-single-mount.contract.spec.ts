import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * PRIORITY D — Deep Audit candidate: the ClaimYourGrowth growth-CTA section
 * must render EXACTLY ONCE on /search results.
 *
 * Root cause: the section is mounted once in the root layout (app/layout.tsx)
 * AND again by three page-level emitters, so every page that mounts its own
 * copy renders the same CTA twice (layout + page).
 *
 * Source-level contract (no network): the root layout is the single mount
 * point; page-level files must not import or render the component at all.
 */
const cwd = process.cwd();
const web = existsSync(join(cwd, 'app', 'page.tsx')) ? cwd : join(cwd, 'apps', 'web');
const read = (p: string) => readFileSync(join(web, p), 'utf8');
const count = (src: string, needle: string) => src.split(needle).length - 1;

const EMITTERS = [
  'app/categories/[slug]/page.tsx',
  'app/products/[slug]/page.tsx',
  'app/search/search-content.tsx',
];

describe('PRIORITY D — ClaimYourGrowth mounts exactly once', () => {
  it('1. the root layout mounts ClaimYourGrowth exactly once', () => {
    const layout = read('app/layout.tsx');
    expect(count(layout, '<ClaimYourGrowth')).toBe(1);
  });

  it('2. page-level emitters render no second ClaimYourGrowth', () => {
    for (const p of EMITTERS) {
      expect(count(read(p), '<ClaimYourGrowth')).toBe(0);
    }
  });

  it('3. page-level emitters carry no import or reference at all', () => {
    for (const p of EMITTERS) {
      expect(read(p)).not.toMatch(/ClaimYourGrowth/);
    }
  });
});
