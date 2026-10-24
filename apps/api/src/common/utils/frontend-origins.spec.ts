import {
  DEFAULT_FRONTEND_ORIGIN,
  getFrontendOrigins,
  getPrimaryFrontendOrigin,
  isAllowedFrontendOrigin,
  normalizeOrigin,
} from './frontend-origins';

describe('frontend-origins', () => {
  describe('getFrontendOrigins', () => {
    it('parses a comma-separated allowlist', () => {
      expect(
        getFrontendOrigins('http://localhost:3000,http://localhost:3116'),
      ).toEqual(['http://localhost:3000', 'http://localhost:3116']);
    });

    it('trims whitespace and drops trailing slashes', () => {
      expect(
        getFrontendOrigins(' http://localhost:3000/ , http://localhost:3116/ '),
      ).toEqual(['http://localhost:3000', 'http://localhost:3116']);
    });

    it('de-duplicates repeated origins', () => {
      expect(
        getFrontendOrigins('http://localhost:3000,http://localhost:3000'),
      ).toEqual(['http://localhost:3000']);
    });

    it('ignores empty entries', () => {
      expect(getFrontendOrigins('http://localhost:3000,,')).toEqual([
        'http://localhost:3000',
      ]);
    });

    it('falls back to the default origin when nothing is configured', () => {
      expect(getFrontendOrigins('')).toEqual([DEFAULT_FRONTEND_ORIGIN]);
      expect(getFrontendOrigins(null)).toEqual([DEFAULT_FRONTEND_ORIGIN]);
    });
  });

  describe('getPrimaryFrontendOrigin', () => {
    it('returns the first entry of the allowlist', () => {
      expect(
        getPrimaryFrontendOrigin(
          'http://localhost:3000,http://localhost:3116',
        ),
      ).toBe('http://localhost:3000');
    });

    it('never returns the raw comma-separated value', () => {
      // new URL(path, <list>) would throw — the primary must be a single origin.
      expect(() =>
        new URL('/login', getPrimaryFrontendOrigin('http://a.test,http://b.test')),
      ).not.toThrow();
    });
  });

  describe('isAllowedFrontendOrigin', () => {
    const allowlist = 'http://localhost:3000,http://localhost:3116';

    it('accepts any origin in the allowlist', () => {
      expect(isAllowedFrontendOrigin('http://localhost:3000', allowlist)).toBe(true);
      expect(isAllowedFrontendOrigin('http://localhost:3116', allowlist)).toBe(true);
    });

    it('rejects an origin that is not in the allowlist', () => {
      expect(isAllowedFrontendOrigin('http://evil.test', allowlist)).toBe(false);
    });

    it('rejects a missing origin', () => {
      expect(isAllowedFrontendOrigin(undefined, allowlist)).toBe(false);
      expect(isAllowedFrontendOrigin('', allowlist)).toBe(false);
    });

    it('normalises the candidate origin before comparing', () => {
      expect(isAllowedFrontendOrigin('http://localhost:3116/', allowlist)).toBe(true);
    });
  });

  describe('normalizeOrigin', () => {
    it('trims and strips trailing slashes', () => {
      expect(normalizeOrigin('  http://localhost:3000//  ')).toBe(
        'http://localhost:3000',
      );
    });
  });
});
