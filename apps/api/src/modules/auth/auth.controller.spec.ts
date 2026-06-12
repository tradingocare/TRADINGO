import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Record<string, jest.Mock>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      verifyEmail: jest.fn(),
      logout: jest.fn(),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 'test@test.com', password: 'Pass123!', name: 'Test' };
      const mockResult = {
        accessToken: 'token', refreshToken: 'rtoken', sessionId: 'sess-1',
        user: { id: '1', email: dto.email, name: 'Test', role: 'VIEWER' },
      };
      authService.register.mockResolvedValue(mockResult);

      const result = await controller.register(dto as any);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('login', () => {
    it('should call authService.login with ip and user agent', async () => {
      const dto = { email: 'test@test.com', password: 'Pass123!' };
      authService.login.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.login(dto as any, 'Mozilla/5.0', { ip: '127.0.0.1' } as any);
      expect(authService.login).toHaveBeenCalledWith(dto, 'Mozilla/5.0', '127.0.0.1');
      expect(result.accessToken).toBe('token');
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens', async () => {
      authService.refreshTokens.mockResolvedValue({ accessToken: 'new-token' });

      const result = await controller.refresh('refresh-token');
      expect(authService.refreshTokens).toHaveBeenCalledWith('refresh-token');
      expect(result.accessToken).toBe('new-token');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return success message', async () => {
      authService.verifyEmail.mockResolvedValue(undefined);

      const result = await controller.verifyEmail('token-123');
      expect(authService.verifyEmail).toHaveBeenCalledWith('token-123');
      expect(result.message).toBe('Email verified successfully');
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      await controller.logout('user-1', 'refresh-token');
      expect(authService.logout).toHaveBeenCalledWith('user-1', 'refresh-token');
    });
  });
});
