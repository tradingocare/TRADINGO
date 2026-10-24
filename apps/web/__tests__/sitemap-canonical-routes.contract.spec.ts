import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Sitemap canonical-route contract.
 *
 * The IA migration moved the service hub from /tradeserv to /service and made
 * /tradeserv a permanent 308. A canonical sitemap must therefore list the
 * destination, never the redirect source, while the deliberately retained
 * /tradeserv/* sub-routes (which are still live) stay listed.
 */

const cwd = process.cwd();
const web = existsSync(join(cwd, 'app', 'page.tsx')) ? cwd : join(cwd, 'apps', 'web');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

const masterData = read('data/master-data.ts');
const nextConfig = read('next.config.ts');
const sitemapPage = read('app/sitemap/page.tsx');

const staticRoutesBlock = masterData.slice(
  masterData.indexOf('export const SITEMAP_STATIC_ROUTES'),
);

function staticRoutePaths(): string[] {
  return [...staticRoutesBlock.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
}

function configuredRedirectSources(): string[] {
  const block = nextConfig.slice(nextConfig.indexOf('async redirects()'));
  return [...block.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]);
}

describe('sitemap canonical-route contract', () => {
  it('lists the canonical service hub /service', () => {
    expect(staticRoutePaths()).toContain('/service');
  });

  it('does not list any configured redirect source as a canonical page', () => {
    const paths = staticRoutePaths();
    const redirects = configuredRedirectSources();

    expect(redirects.length).toBeGreaterThan(0);
    for (const source of redirects) {
      expect(paths).not.toContain(source);
    }
  });

  it('keeps the retained /tradeserv/* sub-routes, which are still live', () => {
    const paths = staticRoutePaths();
    expect(paths).toContain('/tradeserv/categories');
    expect(paths).toContain('/tradeserv/search');
  });

  it('keeps the migrated /product and /categories listing pages', () => {
    const paths = staticRoutePaths();
    expect(paths).toContain('/product');
    expect(paths).toContain('/categories');
  });

  it('links the HTML sitemap UI to the canonical /service route', () => {
    expect(sitemapPage).toContain("href: '/service'");
    expect(sitemapPage).not.toContain("href: '/tradeserv'");
  });
});
