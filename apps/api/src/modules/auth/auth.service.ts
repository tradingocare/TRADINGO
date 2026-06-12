import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { QueueNames, EmailJobTypes } from '../../jobs/queues';

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MINUTES = 15;
const LOCK_WINDOW_SECONDS = 300;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @InjectQueue(QueueNames.EMAIL) private readonly emailQueue: Queue,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, null, null);

    const verificationToken = randomBytes(32).toString('hex');
    await this.redisService.set(`verify:email:${verificationToken}`, user.id, 86400);

    await this.emailQueue.add(QueueNames.EMAIL, {
      type: EmailJobTypes.SEND_WELCOME_EMAIL,
      to: user.email,
      subject: 'Welcome to Trading',
      template: 'welcome',
      context: { name: user.name, verificationToken },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    if (await this.redisService.exists(`lock:user:${dto.email}`)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      await this.handleFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.handleFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });
    await this.redisService.del(`lock:user:${dto.email}`);

    // Invalidate old sessions for this device
    if (userAgent) {
      await this.prisma.session.deleteMany({
        where: { userId: user.id, userAgent },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; sessionId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or not found');
    }

    // Rotate: delete old session
    await this.prisma.session.delete({ where: { id: session.id } });

    const tokens = await this.generateTokens(
      session.user.id,
      session.user.email,
      session.user.role,
      session.user.permissions,
    );
    await this.saveRefreshToken(session.user.id, tokens.refreshToken, session.userAgent, session.ipAddress);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Logout specific session
      let payload: { sub: string; sessionId: string };
      try {
        payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        });
        await this.prisma.session.delete({ where: { id: payload.sessionId } });
      } catch {
        // If token is invalid, delete all sessions for user
        await this.prisma.session.deleteMany({ where: { userId } });
      }
    } else {
      await this.prisma.session.deleteMany({ where: { userId } });
    }
  }

  private async handleFailedLogin(email: string) {
    const key = `lock:user:${email}`;
    const attempts = await this.redisService.incr(key);

    if (attempts === 1) {
      await this.redisService.expire(key, LOCK_WINDOW_SECONDS);
    }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.redisService.expire(key, LOCK_DURATION_MINUTES * 60);

      // Also lock in DB
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts, lockedUntil },
        });
      }

      this.logger.warn(`Account locked: ${email} for ${LOCK_DURATION_MINUTES} minutes`);
    }
  }

  private async generateTokens(userId: string, email: string, role: string, permissions: string[]) {
    const sessionId = uuid();
    const payload = { sub: userId, email, role, permissions };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: userId, sessionId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d') as JwtSignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken, sessionId };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(userId: string, refreshToken: string, userAgent?: string | null, ipAddress?: string | null) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: this.hashToken(refreshToken),
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });
  }

  async verifyEmail(token: string) {
    const userId = await this.redisService.get(`verify:email:${token}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });

    await this.redisService.del(`verify:email:${token}`);
  }
}
