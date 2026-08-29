import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const web = existsSync(join(cwd, 'app', 'page.tsx')) ? cwd : join(cwd, 'apps', 'web');
const read = (p: string) => readFileSync(join(web, p), 'utf8');

describe('P1-01 fabricated stats contract', () => {
  const forbidden: [string, string][] = [
    ['sell-on-tradingo', 'app/sell-on-tradingo/page.tsx'],
    ['buy-from-tradingo', 'app/buy-from-tradingo/page.tsx'],
  ];
  it.each(forbidden)('%s renders no fabricated scale numbers', (_n, f) => {
    const src = read(f);
    expect(src).not.toMatch(/3,50,000|350000|7,500\+|7500/);
  });

  it('homepage has no success-story/testimonial section or import', () => {
    const src = read('app/page.tsx');
    expect(src).not.toContain('HOMEPAGE_SUCCESS_STORIES');
    expect(src).not.toContain('Success Stories');
  });

  it('about page drops testimonials', () => {
    const src = read('app/about-tradingo/page.tsx');
    expect(src).not.toContain('testimonialsData');
    expect(src).not.toContain('What Our Traders Say');
  });

  it('launch page drops testimonials', () => {
    const src = read('app/launch/page.tsx');
    expect(src).not.toContain('launchTestimonials');
    expect(src).not.toContain('LAUNCH_TESTIMONIALS');
  });

  it('IndiaHubs per-state fabricated counters removed; real platform strip kept', () => {
    const src = read('components/sections/IndiaHubs.tsx');
    expect(src).not.toContain('formatCompact(state.productsListed)');
    expect(src).not.toContain('formatCompact(state.activeSellers)');
    expect(src).not.toContain('formatCompact(state.activeBuyers)');
    expect(src).toContain('getPlatformStats');
  });

  it('BusinessCities per-city scale grid removed', () => {
    const src = read('components/sections/BusinessCities.tsx');
    expect(src).not.toContain("label: 'Sellers', value: formatNum(city.sellers)");
    expect(src).not.toContain("value: formatNum(city.buyers)");
  });

  it('demo /product route retired with zero references', () => {
    expect(existsSync(join(web, 'app/product/page.tsx'))).toBe(false);
    for (const f of ['app/page.tsx', 'components/shared/footer.tsx']) {
      expect(read(f)).not.toMatch(/href="\/product"/);
    }
  });
});
