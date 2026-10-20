import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * P0 — Deep Audit candidate: /search must preserve ?q= through SSR.
 *
 * Root cause: the page types searchParams synchronously and reads
 * `searchParams.q` directly. Next 16 delivers searchParams as a Promise, so
 * the read yields undefined, `q` collapses to '' and every /search?q=...
 * request renders the empty-state branch instead of results.
 *
 * Source-level contract (no network): the page must be async and await the
 * shared resolveSearchParams() helper before reading q.
 */
const cwd = process.cwd();
const web = existsSync(join(cwd, 'app', 'page.tsx')) ? cwd : join(cwd, 'apps', 'web');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

describe('P0 — /search awaits searchParams before reading q', () => {
  const src = read('app/search/page.tsx');

  it('1. the default export is async', () => {
    expect(src).toMatch(/export\s+default\s+async\s+function\s+SearchPage/);
  });

  it('2. the page awaits the shared resolveSearchParams helper', () => {
    const pageBody = src.slice(src.indexOf('export default'));
    expect(pageBody).toMatch(/await\s+resolveSearchParams\s*\(\s*searchParams/);
  });

  it('3. no raw synchronous searchParams property access remains', () => {
    expect(src).not.toMatch(/searchParams\.q/);
  });
});
