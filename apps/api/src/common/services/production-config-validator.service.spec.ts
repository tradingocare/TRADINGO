import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { ProductionConfigValidator } from './production-config-validator.service';

/**
 * Regression coverage for the Phase 01B JWT finding:
 *
 * The published development default `local-development-secret-key-32chars-minimum`
 * is 44 characters long, so it satisfies Joi's `min(32)` rule, and it matches
 * none of the prose PLACEHOLDER_PATTERNS. Before the fix it was therefore
 * classified CONFIGURED, `validate()` returned zero errors, and a production
 * API booted and signed HS256 access/refresh tokens with a secret that is
 * published in this repository.
 */

const REPORTED_ACCESS_SECRET = 'local-development-secret-key-32chars-minimum';
const REPORTED_REFRESH_SECRET = 'local-development-refresh-secret-32chars-min';

const LEGITIMATE_ACCESS_SECRET =
  '7f3c9e2b8d4f6a1c5e9b2d7f4a8c3e6b1d9f2a5c8e4b7d1a6f9c3e8b2d5a4c7e';
const LEGITIMATE_REFRESH_SECRET =
  '2a8f4c6e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a';

type ConfigValues = Record<string, unknown>;

function makeConfig(values: ConfigValues): ConfigService {
  return {
    get: (key: string, defaultValue?: unknown) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : defaultValue,
  } as unknown as ConfigService;
}

/** A config where every value required by the production checks is present. */
function baseConfig(overrides: ConfigValues = {}): ConfigService {
  return makeConfig({
    'jwt.secret': LEGITIMATE_ACCESS_SECRET,
    'jwt.refreshSecret': LEGITIMATE_REFRESH_SECRET,
    'database.url': 'postgresql://postgres@db:5432/tradingo',
    'redis.url': 'redis://redis:6379',
    ...overrides,
  });
}

function jwtErrors(errors: string[]): string[] {
  return errors.filter((e) => e.includes('JWT_SECRET') || e.includes('JWT_REFRESH_SECRET'));
}

describe('ProductionConfigValidator — JWT secret safety', () => {
  const validator = new ProductionConfigValidator();
  const savedEnv = { ...process.env };

  beforeEach(() => {
    // Since Phase 01N the AI vault master key is required in production, so the
    // production-mode fixtures supply a strong value unless a test overrides it.
    process.env.AI_VAULT_MASTER_KEY = 'e'.repeat(48);
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  describe('in production mode', () => {
    it('rejects the published development access secret reported in Phase 01B', () => {
      const result = validator.validate(
        baseConfig({ 'jwt.secret': REPORTED_ACCESS_SECRET }),
        true,
      );

      expect(jwtErrors(result.errors)).toHaveLength(1);
      expect(result.errors[0]).toContain('JWT_SECRET');
      expect(result.errors[0]).toContain('publicly known development default');

      const report = result.report.find((r) => r.name === 'JWT_SECRET');
      expect(report?.status).toBe('PLACEHOLDER');
    });

    it('rejects the published development refresh secret reported in Phase 01B', () => {
      const result = validator.validate(
        baseConfig({ 'jwt.refreshSecret': REPORTED_REFRESH_SECRET }),
        true,
      );

      expect(jwtErrors(result.errors)).toHaveLength(1);
      expect(result.errors[0]).toContain('JWT_REFRESH_SECRET');
      expect(result.errors[0]).toContain('publicly known development default');

      const report = result.report.find((r) => r.name === 'JWT_REFRESH_SECRET');
      expect(report?.status).toBe('PLACEHOLDER');
    });

    it('rejects a publicly known value that satisfies the minimum length rule', () => {
      // The reported default is 44 chars: it passes Joi's min(32) and would
      // pass any length-only check. Length alone must never be trusted.
      expect(REPORTED_ACCESS_SECRET.length).toBeGreaterThanOrEqual(32);

      const result = validator.validate(
        baseConfig({ 'jwt.secret': REPORTED_ACCESS_SECRET }),
        true,
      );

      expect(jwtErrors(result.errors)).toHaveLength(1);
    });

    it('rejects a missing access secret', () => {
      const result = validator.validate(
        baseConfig({ 'jwt.secret': undefined }),
        true,
      );

      expect(jwtErrors(result.errors)).toHaveLength(1);
      expect(result.errors[0]).toContain('JWT_SECRET is invalid, missing, or still a placeholder');
    });

    it('rejects an empty access secret', () => {
      const result = validator.validate(baseConfig({ 'jwt.secret': '' }), true);

      expect(jwtErrors(result.errors)).toHaveLength(1);
      expect(result.errors[0]).toContain('JWT_SECRET is invalid, missing, or still a placeholder');
    });

    it('rejects an empty refresh secret', () => {
      const result = validator.validate(baseConfig({ 'jwt.refreshSecret': '' }), true);

      expect(jwtErrors(result.errors)).toHaveLength(1);
      expect(result.errors[0]).toContain('JWT_REFRESH_SECRET is invalid, missing, or still a placeholder');
    });

    it('rejects a prose placeholder', () => {
      const result = validator.validate(
        baseConfig({ 'jwt.secret': 'change-me-to-a-random-64-char-string' }),
        true,
      );

      expect(jwtErrors(result.errors)).toHaveLength(1);
    });

    it('accepts a legitimate configured secret', () => {
      const result = validator.validate(baseConfig(), true);

      expect(jwtErrors(result.errors)).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      const access = result.report.find((r) => r.name === 'JWT_SECRET');
      const refresh = result.report.find((r) => r.name === 'JWT_REFRESH_SECRET');
      expect(access?.status).toBe('CONFIGURED');
      expect(refresh?.status).toBe('CONFIGURED');
    });

    it('reports a missing secret as MISSING', () => {
      const result = validator.validate(baseConfig({ 'jwt.secret': '' }), true);

      const report = result.report.find((r) => r.name === 'JWT_SECRET');
      expect(report?.status).toBe('MISSING');
      expect(report?.fatalOnMissing).toBe(true);
    });
  });

  describe('outside production mode', () => {
    it('still surfaces the published development secret as an error', () => {
      // Development keeps booting (existing architecture), but the unsafe
      // value must still be reported by /health/config-status.
      const result = validator.validate(
        baseConfig({ 'jwt.secret': REPORTED_ACCESS_SECRET }),
        false,
      );

      expect(jwtErrors(result.errors)).toHaveLength(1);
      expect(result.isProduction).toBe(false);
    });
  });

  describe('known-unsafe literal detection', () => {
    it('matches the published literals exactly', () => {
      expect(ProductionConfigValidator.isKnownUnsafeSecret(REPORTED_ACCESS_SECRET)).toBe(true);
      expect(ProductionConfigValidator.isKnownUnsafeSecret(REPORTED_REFRESH_SECRET)).toBe(true);
    });

    it('ignores surrounding whitespace and letter case', () => {
      expect(
        ProductionConfigValidator.isKnownUnsafeSecret(`  ${REPORTED_ACCESS_SECRET.toUpperCase()}  `),
      ).toBe(true);
    });

    it('does not flag a legitimate secret that merely resembles one', () => {
      expect(
        ProductionConfigValidator.isKnownUnsafeSecret(`${REPORTED_ACCESS_SECRET}-rotated`),
      ).toBe(false);
      expect(ProductionConfigValidator.isKnownUnsafeSecret(LEGITIMATE_ACCESS_SECRET)).toBe(false);
    });

    it('does not flag an empty or absent value', () => {
      expect(ProductionConfigValidator.isKnownUnsafeSecret('')).toBe(false);
      expect(ProductionConfigValidator.isKnownUnsafeSecret(undefined)).toBe(false);
    });

    it('classifies the published literal as PLACEHOLDER', () => {
      expect(ProductionConfigValidator.classify(REPORTED_ACCESS_SECRET)).toBe('PLACEHOLDER');
      expect(ProductionConfigValidator.classify(LEGITIMATE_ACCESS_SECRET)).toBe('CONFIGURED');
      expect(ProductionConfigValidator.classify('')).toBe('MISSING');
    });
  });

  describe('docker-compose.yml must not ship a published JWT secret', () => {
    const composePath = path.resolve(__dirname, '../../../../../docker-compose.yml');
    const compose = fs.readFileSync(composePath, 'utf8');

    it('contains neither published development literal', () => {
      expect(compose).not.toContain(REPORTED_ACCESS_SECRET);
      expect(compose).not.toContain(REPORTED_REFRESH_SECRET);
    });

    it('passes the JWT secrets through as plain interpolations with no inline default', () => {
      const jwtSecretLine = compose
        .split(/\r?\n/)
        .find((line) => /^\s*JWT_SECRET:/.test(line));
      const jwtRefreshLine = compose
        .split(/\r?\n/)
        .find((line) => /^\s*JWT_REFRESH_SECRET:/.test(line));

      expect(jwtSecretLine).toBeDefined();
      expect(jwtRefreshLine).toBeDefined();
      // No `:-default` — an unset variable must resolve to empty so the API
      // fails closed instead of booting with a repository-public secret.
      expect(jwtSecretLine).not.toContain(':-');
      expect(jwtRefreshLine).not.toContain(':-');
    });
  });

  describe('AI vault master key (security-critical)', () => {
    const validator = new ProductionConfigValidator();
    const PUBLISHED_AI_VAULT_LITERAL = 'local-development-ai-vault-master-key-32chars-minimum';
    const saved = { ...process.env };

    afterEach(() => {
      process.env = { ...saved };
    });

    function withVaultKey(value: string | undefined) {
      if (value === undefined) delete process.env.AI_VAULT_MASTER_KEY;
      else process.env.AI_VAULT_MASTER_KEY = value;
    }

    it('fails closed in production when the master key is missing', () => {
      withVaultKey(undefined);
      const result = validator.validate(baseConfig(), true);
      expect(result.errors.some((e) => e.includes('AI_VAULT_MASTER_KEY'))).toBe(true);
    });

    it('fails closed in production when the master key is empty', () => {
      withVaultKey('');
      const result = validator.validate(baseConfig(), true);
      expect(result.errors.some((e) => e.includes('AI_VAULT_MASTER_KEY'))).toBe(true);
    });

    it('fails closed in production for the published development master key', () => {
      withVaultKey(PUBLISHED_AI_VAULT_LITERAL);
      const result = validator.validate(baseConfig(), true);
      expect(result.errors.some((e) => e.includes('AI_VAULT_MASTER_KEY'))).toBe(true);
    });

    it('never reports the published master key as configured', () => {
      withVaultKey(PUBLISHED_AI_VAULT_LITERAL);
      const result = validator.validate(baseConfig(), true);
      const report = result.report.find((r) => r.name === 'AI_VAULT_MASTER_KEY');
      expect(report?.status).not.toBe('CONFIGURED');
      expect(ProductionConfigValidator.isKnownUnsafeSecret(PUBLISHED_AI_VAULT_LITERAL)).toBe(true);
    });

    it('accepts a strong configured master key', () => {
      withVaultKey('f'.repeat(48));
      const result = validator.validate(baseConfig(), true);
      expect(result.errors.some((e) => e.includes('AI_VAULT_MASTER_KEY'))).toBe(false);
    });
  });

  describe('AWS storage is optional for the current release', () => {
    const validator = new ProductionConfigValidator();
    const saved = { ...process.env };

    afterEach(() => {
      process.env = { ...saved };
    });

    it('does not treat a missing bucket as a production error', () => {
      delete process.env.AWS_BUCKET;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      const result = validator.validate(baseConfig(), true);
      expect(result.errors.some((e) => e.includes('AWS'))).toBe(false);
    });

    it('does not treat a missing bucket as a production warning that blocks boot', () => {
      delete process.env.AWS_BUCKET;
      const result = validator.validate(baseConfig(), true);
      const report = result.report.find((r) => r.name === 'AWS_BUCKET');
      expect(report?.required).toBe(false);
      expect(report?.fatalOnMissing).toBe(false);
    });
  });
});
