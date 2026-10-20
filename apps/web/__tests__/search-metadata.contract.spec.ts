import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const web = existsSync(join(cwd, 'app', 'page.tsx')) ? cwd : join(cwd, 'apps', 'web');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

describe('Priority B — /search title single brand suffix contract', () => {
  const src = read('app/search/page.tsx');

  it('SEARCH_TITLE must not embed a brand suffix (root layout template appends "| TRADINGO")', () => {
    const m = src.match(/const SEARCH_TITLE = '([^']*)'/);
    expect(m).not.toBeNull();
    expect((m as RegExpMatchArray)[1]).not.toMatch(/TRADINGO/i);
  });

  it('generateMetadata still returns title from SEARCH_TITLE', () => {
    expect(src).toMatch(/title: SEARCH_TITLE/);
  });
});
