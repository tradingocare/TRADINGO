/**
 * PHASE 2-A — contract guards for the shared SEO indexing-policy helpers.
 * Pure functions only; no Next.js runtime, no network.
 */
import {
  TRACKING_PARAMS,
  buildSelfCanonical,
  eligibilityRobots,
  firstValue,
  getSubcategoryEligibility,
  hasIndexAffectingParams,
  resolveSearchParams,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
} from '../seo-policy';

describe('PHASE 2-A — seo-policy helpers', () => {
  describe('resolveSearchParams', () => {
    it('resolves a plain object verbatim', async () => {
      await expect(resolveSearchParams({ q: 'steel', page: '2' })).resolves.toEqual({
        q: 'steel',
        page: '2',
      });
    });

    it('resolves a Promise of a plain object (Next 15+ shape)', async () => {
      await expect(resolveSearchParams(Promise.resolve({ q: 'steel' }))).resolves.toEqual({
        q: 'steel',
      });
    });

    it('resolves URLSearchParams including repeated keys', async () => {
      const sp = new URLSearchParams('q=steel&q=cement&page=2');
      await expect(resolveSearchParams(sp)).resolves.toEqual({
        q: ['steel', 'cement'],
        page: '2',
      });
    });

    it('returns {} for null/undefined/rejected input', async () => {
      await expect(resolveSearchParams(null)).resolves.toEqual({});
      await expect(resolveSearchParams(undefined)).resolves.toEqual({});
      await expect(resolveSearchParams(Promise.reject(new Error('x')))).resolves.toEqual({});
    });
  });

  describe('firstValue', () => {
    it('collapses arrays to first non-empty entry', () => {
      expect(firstValue(['', 'cement'])).toBe('cement');
      expect(firstValue(['', ''])).toBeUndefined();
      expect(firstValue('steel')).toBe('steel');
      expect(firstValue('')).toBeUndefined();
      expect(firstValue(undefined)).toBeUndefined();
    });
  });

  describe('hasIndexAffectingParams', () => {
    it('is false for empty params', () => {
      expect(hasIndexAffectingParams({})).toBe(false);
    });

    it('is false for tracking-only params (utm_*, gclid, fbclid)', () => {
      expect(
        hasIndexAffectingParams({ utm_source: 'google', gclid: 'abc', fbclid: 'x', UTM_MEDIUM: 'cpc' }),
      ).toBe(false);
      expect(TRACKING_PARAMS.size).toBeGreaterThan(0);
    });

    it('is true for any non-tracking non-empty param when no key list given', () => {
      expect(hasIndexAffectingParams({ q: 'steel' })).toBe(true);
      expect(hasIndexAffectingParams({ page: '2' })).toBe(true);
      expect(hasIndexAffectingParams({ q: '', page: '' })).toBe(false);
    });

    it('restricts to the provided key list when given', () => {
      expect(hasIndexAffectingParams({ unknown_future_param: '1' }, ['q', 'page'])).toBe(false);
      expect(hasIndexAffectingParams({ q: 'steel', unknown_future_param: '1' }, ['q', 'page'])).toBe(true);
      expect(hasIndexAffectingParams({ utm_source: 'x', page: '2' }, ['q', 'page'])).toBe(true);
    });
  });

  describe('robots constants', () => {
    it('variant policy is noindex+follow; base policy is index+follow', () => {
      expect(ROBOTS_NOINDEX_FOLLOW).toEqual({ index: false, follow: true });
      expect(ROBOTS_INDEX_FOLLOW).toEqual({ index: true, follow: true });
    });
  });

  describe('getSubcategoryEligibility (Phase 2-B §8)', () => {
    it('INDEX when live products exist', () => {
      expect(
        getSubcategoryEligibility({
          categoryIsActive: true,
          subcategoryExists: true,
          activeProductCount: 5,
          activeCatalogItemCount: 21,
        }),
      ).toBe('INDEX');
    });

    it('HOLD when taxonomy is real but no live products exist', () => {
      expect(
        getSubcategoryEligibility({
          categoryIsActive: true,
          subcategoryExists: true,
          activeProductCount: 0,
          activeCatalogItemCount: 21,
        }),
      ).toBe('HOLD');
    });

    it('NOINDEX when nothing exists (degenerate taxonomy)', () => {
      expect(
        getSubcategoryEligibility({
          categoryIsActive: true,
          subcategoryExists: true,
          activeProductCount: 0,
          activeCatalogItemCount: 0,
        }),
      ).toBe('NOINDEX');
    });

    it('NOINDEX when the category is inactive (listings or not)', () => {
      expect(
        getSubcategoryEligibility({
          categoryIsActive: false,
          subcategoryExists: true,
          activeProductCount: 9,
          activeCatalogItemCount: 21,
        }),
      ).toBe('NOINDEX');
    });

    it('NOINDEX when the subcategory does not exist', () => {
      expect(
        getSubcategoryEligibility({
          categoryIsActive: true,
          subcategoryExists: false,
          activeProductCount: 0,
          activeCatalogItemCount: 0,
        }),
      ).toBe('NOINDEX');
    });

    it('maps INDEX/HOLD to index+follow and NOINDEX to noindex+follow', () => {
      expect(eligibilityRobots('INDEX')).toEqual({ index: true, follow: true });
      expect(eligibilityRobots('HOLD')).toEqual({ index: true, follow: true });
      expect(eligibilityRobots('NOINDEX')).toEqual({ index: false, follow: true });
    });
  });

  describe('buildSelfCanonical', () => {
    it('returns the bare base URL when no index-affecting params exist', () => {
      expect(buildSelfCanonical('https://tradingo.in/search', {})).toBe('https://tradingo.in/search');
      expect(buildSelfCanonical('https://tradingo.in/search', { utm_source: 'g', q: '' })).toBe(
        'https://tradingo.in/search',
      );
    });

    it('self-canonicalizes filtered requests (sorted, tracking stripped)', () => {
      expect(
        buildSelfCanonical('https://tradingo.in/search', { page: '2', q: 'steel', utm_medium: 'cpc' }),
      ).toBe('https://tradingo.in/search?page=2&q=steel');
    });

    it('preserves repeated params', () => {
      expect(buildSelfCanonical('https://tradingo.in/x', { tag: ['a', 'b'] })).toBe(
        'https://tradingo.in/x?tag=a&tag=b',
      );
    });
  });
});
