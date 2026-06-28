import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
import * as bcrypt from 'bcrypt';

interface MockPrisma {
  user: Record<string, jest.Mock>;
  session: Record<string, jest.Mock>;
}

interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  incr: jest.Mock;
  expire: jest.Mock;
  exists: jest.Mock;
  ttl: jest.Mock;
}

interface MockJwt {
  sign: jest.Mock;
  verify: jest.Mock;
}

interface MockQueue {
  add: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let redisService: MockRedis;
  let jwtService: MockJwt;
  let emailQueue: MockQueue;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    mobile: null,
    panNumber: null,
    name: 'Test',
    role: 'VIEWER',
    status: 'active',
    permissions: [],
    passwordHash: 'hashed',
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    emailQueue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
        { provide: getQueueToken('email'), useValue: emailQueue },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                'jwt.refreshSecret': 'refresh-secret',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates user, session, queues welcome email, and stores verification token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.register({ email: 'test@example.com', password: 'Pass@1234', name: 'Test' });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.session.create).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('verify:email:'),
        mockUser.id,
        86400,
      );
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-token');
    });

    it('throws ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.register({ email: 'test@example.com', password: 'Pass@1234', name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('succeeds with valid credentials', async () => {
      redisService.exists.mockResolvedValue(false);
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});
      prisma.session.deleteMany.mockResolvedValue({ count: 0 });
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.login({ identifier: 'test@example.com', password: 'Pass@1234' });

      expect(result.accessToken).toBe('mock-token');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ loginAttempts: 0 }) }),
      );
    });

    it('fails with wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(1);
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.login({ identifier: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('locks account after 3 failed attempts', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(3);
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      await expect(service.login({ identifier: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ loginAttempts: 3 }) }),
      );
    });

    it('rejects locked account with generic message', async () => {
      redisService.exists.mockResolvedValue(true);
      await expect(service.login({ identifier: 'test@example.com', password: 'Pass@1234' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('calls handleFailedLogin for non-existent user', async () => {
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(1);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login({ identifier: 'nonexistent@example.com', password: 'any' }))
        .rejects.toThrow(UnauthorizedException);
      expect(redisService.incr).toHaveBeenCalledWith('lock:user:nonexistent@example.com');
    });

    describe('verifyEmail', () => {
      it('verifies email with valid token', async () => {
        redisService.get.mockResolvedValue('user-1');
        prisma.user.update.mockResolvedValue({});

        await service.verifyEmail('valid-token');

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'user-1' },
            data: expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
          }),
        );
        expect(redisService.del).toHaveBeenCalledWith('verify:email:valid-token');
      });

      it('throws UnauthorizedException for invalid token', async () => {
        redisService.get.mockResolvedValue(null);
        await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('refreshTokens', () => {
    it('rotates session correctly', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      prisma.session.delete.mockResolvedValue({});
      prisma.session.create.mockResolvedValue({ id: 'session-2' });

      const result = await service.refreshTokens('valid-refresh-token');
      expect(result.accessToken).toBe('mock-token');
    });

    it('throws UnauthorizedException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => { throw new Error(); });

      await expect(service.refreshTokens('invalid-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
