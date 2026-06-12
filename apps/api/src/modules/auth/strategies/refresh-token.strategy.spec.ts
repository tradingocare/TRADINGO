import { RefreshTokenStrategy } from './refresh-token.strategy';

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;

  beforeEach(() => {
    strategy = new RefreshTokenStrategy(
      { get: jest.fn((key: string) => key === 'jwt.refreshSecret' ? 'refresh-secret' : undefined) } as any,
    );
  });

  describe('validate', () => {
    it('should return payload with refresh token from body', async () => {
      const req = { body: { refreshToken: 'rtoken-123' } } as any;
      const payload = { sub: 'user-1' };
      const result = await strategy.validate(req, payload);
      expect(result.sub).toBe('user-1');
      expect(result.refreshToken).toBe('rtoken-123');
    });
  });
});
