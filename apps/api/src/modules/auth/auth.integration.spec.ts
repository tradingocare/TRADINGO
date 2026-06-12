import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  session: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
};
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), exists: jest.fn(), incr: jest.fn(), expire: jest.fn() };
const mockJwt = { sign: jest.fn(), verify: jest.fn() };
const mockConfig = { get: jest.fn() };
const mockEmailQueue = { add: jest.fn() };

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mock-session-id') }));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('mock-token') }),
  createHash: jest.fn().mockReturnValue({ update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue('hashed-refresh-token') }) }),
}));

describe('Auth Flow Integration', () => {
  let controller: AuthController;
  let service: AuthService;

  function configureModule() {
    jest.clearAllMocks();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'jwt.expiresIn') return '15m';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return undefined;
    });
    mockJwt.sign.mockReturnValue('mock-access-token');
    mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
  }

  beforeEach(async () => {
    configureModule();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: getQueueToken('email'), useValue: mockEmailQueue },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => { jest.restoreAllMocks(); });

  describe('Registration Flow', () => {
    it('completes full registration successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await controller.register({ email: 'test@example.com', password: 'Pass1234!', name: 'Test' });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-access-token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email: 'test@example.com' }),
      }));
      expect(mockEmailQueue.add).toHaveBeenCalled();
    });

    it('rejects duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(controller.register({ email: 'dup@example.com', password: 'Pass1234!', name: 'Test' }))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('Login Flow', () => {
    it('completes login with valid credentials', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER', passwordHash: 'hash', isActive: true, loginAttempts: 0, lockedUntil: null, permissions: [] });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await controller.login({ email: 'test@example.com', password: 'Pass1234!' });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('rejects invalid credentials', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      await expect(controller.login({ email: 'bad@example.com', password: 'WrongPass1!' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('rejects locked account', async () => {
      mockRedis.exists.mockResolvedValue(true);

      await expect(controller.login({ email: 'locked@example.com', password: 'Pass1234!' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('locks account after max failed attempts', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com', passwordHash: 'hash', isActive: true, loginAttempts: 0, lockedUntil: null });
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);
      mockRedis.incr.mockResolvedValue(3);

      await expect(controller.login({ email: 'test@example.com', password: 'WrongPass1!' }))
        .rejects.toThrow('Invalid credentials');
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ loginAttempts: 3 }),
      }));
    });
  });

  describe('Token Refresh Flow', () => {
    it('completes refresh with valid token', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'test@example.com', role: 'USER', permissions: [] },
        userAgent: null,
        ipAddress: null,
      });
      mockPrisma.session.delete.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({ id: 'session-2' });

      const result = await controller.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('mock-access-token');
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });

    it('rejects expired session', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date(Date.now() - 86400000),
        user: { id: 'user-1', email: 'test@example.com', role: 'USER', permissions: [] },
      });

      await expect(controller.refresh('expired-token')).rejects.toThrow('Session expired or not found');
    });
  });

  describe('Logout Flow', () => {
    it('logs out specific session when refresh token provided', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.delete.mockResolvedValue({});

      await controller.logout('user-1', 'valid-refresh-token');

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });

    it('deletes all sessions on logout without token', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });

      await controller.logout('user-1', undefined);

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('deletes all sessions when refresh token is invalid', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });

      await controller.logout('user-1', 'bad-token');

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });

  describe('Email Verification Flow', () => {
    it('verifies email with valid token', async () => {
      mockRedis.get.mockResolvedValue('user-1');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await controller.verifyEmail('valid-token');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: expect.any(Date) },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('verify:email:valid-token');
    });

    it('rejects invalid verification token', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(controller.verifyEmail('bad-token'))
        .rejects.toThrow('Invalid or expired verification token');
    });
  });
});
