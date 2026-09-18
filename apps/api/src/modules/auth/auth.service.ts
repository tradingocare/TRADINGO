import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException, NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { BusinessType, Company, CompanyStructure, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { SmsService } from '../sms/sms.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { MembershipService } from '../membership/membership.service';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';
import { CatalogClassifyService } from '../marketplace-catalog-bridge/catalog-classify.service';
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { UpdateMeDto } from './dto/update-me.dto';
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
    private readonly smsService: SmsService,
    private readonly auditLog: AuditLogService,
    private readonly notification: NotificationService,
    private readonly membership: MembershipService,
    private readonly vendorCodes: VendorCodesService,
    private readonly catalogClassify: CatalogClassifyService,
    private readonly taxonomyPersistence: CatalogTaxonomyPersistenceService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QueueNames.EMAIL) private readonly emailQueue: Queue,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        mobile: dto.mobile || null,
        role: 'BUYER',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    const verificationToken = randomBytes(32).toString('hex');
    await this.redisService.set(`verify:email:${verificationToken}`, user.id, 86400);

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/verify-email`;
    await this.emailQueue.add(QueueNames.EMAIL, {
      type: EmailJobTypes.SEND_WELCOME_EMAIL,
      to: user.email,
      subject: 'Welcome to Trading',
      template: 'welcome',
      context: { name: user.name, verificationToken, verificationUrl },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  private async findUserByIdentifier(identifier: string) {
    const cleanMobile = identifier.replace(/^\+91|\s/g, '');
    const panUpper = identifier.toUpperCase();

    const direct = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { mobile: cleanMobile },
          { panNumber: panUpper },
        ],
      },
    });
    if (direct) return direct;

    // PAN login fallback (F9): legacy vendor accounts hold their legal PAN on
    // Company.panNumber (User.panNumber was never persisted). Resolve ONLY
    // through CompanyOwner ownership linkage — never by scanning arbitrary
    // companies by PAN — so one user's PAN can never authenticate as another
    // company's user. Company.panNumber remains the legal source of truth.
    const panKey = panUpper.replace(/\s/g, '');
    if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panKey)) {
      const owner = await this.prisma.companyOwner.findFirst({
        where: { company: { panNumber: panKey } },
        include: { user: true },
      });
      if (owner?.user) return owner.user;
    }

    return null;
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const lockKey = `lock:user:${dto.identifier}`;
    if (await this.redisService.exists(lockKey)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user?.isActive) {
      await this.handleFailedLogin(dto.identifier, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Role check
    if (dto.role && dto.role !== 'any') {
      const roleMap: Record<string,string[]> = {
        buyer:  ['buyer', 'VIEWER', 'SELLER', 'BUYER'],
        vendor: ['vendor','seller','MANAGER','SELLER'],
        admin:  ['admin','super_admin','rm','SUPER_ADMIN','ADMIN'],
      };
      if (!roleMap[dto.role]?.includes(user.role as string))
        throw new UnauthorizedException('This account is not a ' + dto.role + ' account');
    }

    // Status checks (using isActive + lockedUntil for now)
    if (!user.isActive)
      throw new ForbiddenException('Account suspended. Contact support@tradingo.com');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.handleFailedLogin(dto.identifier, ipAddress);
      throw new UnauthorizedException('Incorrect password');
    }

    // Reset login attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });
    await this.redisService.del(lockKey);

    if (userAgent) {
      await this.prisma.session.updateMany({
        where: { userId: user.id, userAgent, isActive: true },
        data: { isActive: false },
      });
    }

    // Prime Redis JWT cache to avoid DB hit on next request
    await this.redisService.set(`user:active:${user.id}`, 'true', 300);

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, userAgent, ipAddress);

    // Update rememberMe expiry for refresh token
    const cookieMaxAge = dto.rememberMe ? 30 * 24 * 60 * 60 : 15 * 60;

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
      expiresIn: cookieMaxAge,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        isActive: true, emailVerifiedAt: true, mobile: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { user };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const profileData: { name?: string; mobile?: string } = {};
    if (dto.name !== undefined) profileData.name = dto.name;
    if (dto.mobile !== undefined) profileData.mobile = dto.mobile;

    if (Object.keys(profileData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: profileData,
      });
    }

    const toggles = dto.preferences?.notifications ?? dto.notifications;
    if (toggles && Object.keys(toggles).length > 0) {
      const owner = await this.prisma.companyOwner.findFirst({
        where: { userId, company: { deletedAt: null } },
        select: { companyId: true },
      });
      if (owner) {
        for (const [label, enabled] of Object.entries(toggles)) {
          const normalized = label.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
          const type = NotificationType[normalized as keyof typeof NotificationType]
            ? (normalized as NotificationType)
            : NotificationType.GENERIC;
          await this.notification.upsertPreference(owner.companyId, userId, {
            channel: 'EMAIL',
            type,
            enabled: Boolean(enabled),
          });
        }
      }
    }

    return this.getProfile(userId);
  }

  private async linkCompanyCategories(companyId: string, categoryNames: string[], tx: Prisma.TransactionClient) {
    const uniqueNames = [...new Set((categoryNames || []).map((n) => n?.trim()).filter(Boolean))];
    if (uniqueNames.length === 0) return;

    // F-06 (fail-closed, founder-approved): every name resolves through the
    // canonical resolver BEFORE any write. Exactly one valid resolution links
    // via the existing CompanyCategory join; unresolvable or ambiguous names
    // reject the whole registration with 400 — never warn-and-continue, never
    // multi-link, never silent drop. All names resolve first so a late reject
    // leaves no partial linkage (the callers run inside $transaction anyway).
    const legacyIds: string[] = [];
    for (const name of uniqueNames) {
      const resolved = await this.catalogClassify.resolveCategoryText(name);
      if (!resolved) {
        throw new BadRequestException(
          `Unknown business category: "${name}". Please select a category from the list.`,
        );
      }
      const exactMatches = await tx.catalogCategory.count({
        where: { isActive: true, name: { equals: name, mode: 'insensitive' } },
      });
      if (exactMatches > 1) {
        throw new BadRequestException(
          `Ambiguous business category: "${name}" matches multiple categories. Please select a more specific category.`,
        );
      }
      if (resolved.matchType === 'synonym') {
        const fuzzyMatches = await tx.catalogCategory.count({
          where: { isActive: true, name: { contains: name, mode: 'insensitive' } },
        });
        if (fuzzyMatches > 1) {
          throw new BadRequestException(
            `Ambiguous business category: "${name}" matches multiple categories. Please select a more specific category.`,
          );
        }
      }
      const legacyId = await this.taxonomyPersistence.bridgeLegacyCategoryId(resolved.categoryId);
      if (!legacyId) {
        throw new BadRequestException(
          `Business category "${name}" cannot be linked yet. Please select a different category.`,
        );
      }
      legacyIds.push(legacyId);
    }

    await tx.companyCategory.createMany({
      data: legacyIds.map((categoryId) => ({ companyId, categoryId })),
      skipDuplicates: true,
    });
  }

  /**
   * F-07 cascade picks (vendor Step-5): link already-disambiguated canonical
   * category IDs. Each ID is re-validated server-side (exists + active) and
   * bridged to its legacy twin — never trusted blindly, never re-resolved by
   * name (that would reintroduce F-06 ambiguity). Fail-closed like the name
   * path: unknown/inactive/untwinned IDs reject with 400 and write nothing.
   */
  private async linkCompanyCanonicalCategories(companyId: string, catalogCategoryIds: (string | null | undefined)[], tx: Prisma.TransactionClient) {
    const uniqueIds = [...new Set((catalogCategoryIds || []).map((id) => id?.trim()).filter(Boolean))] as string[];
    if (uniqueIds.length === 0) return;

    const legacyIds: string[] = [];
    for (const catalogCategoryId of uniqueIds) {
      const canonical = await tx.catalogCategory.findUnique({
        where: { id: catalogCategoryId },
        select: { id: true, isActive: true },
      });
      if (!canonical || !canonical.isActive) {
        throw new BadRequestException(
          'Unknown or inactive business category selection. Please reselect the category.',
        );
      }
      const legacyId = await this.taxonomyPersistence.bridgeLegacyCategoryId(canonical.id);
      if (!legacyId) {
        throw new BadRequestException(
          'Business category selection cannot be linked yet. Please select a different category.',
        );
      }
      legacyIds.push(legacyId);
    }

    await tx.companyCategory.createMany({
      data: legacyIds.map((categoryId) => ({ companyId, categoryId })),
      skipDuplicates: true,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all sessions on password change (forces re-login)
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Immediately invalidate Redis JWT cache — forces next request to re-validate
    await this.redisService.del(`user:active:${userId}`);

    this.logger.log(`Password changed for user: ${userId}`);
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      select: {
        id: true, userAgent: true, ipAddress: true, deviceInfo: true,
        createdAt: true, lastUsedAt: true, expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
    return { sessions };
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.session.update({ where: { id: sessionId }, data: { isActive: false } });
    this.logger.log(`Session revoked: ${sessionId} for user: ${userId}`);
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found with this email');
    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    const verificationToken = randomBytes(32).toString('hex');
    await this.redisService.set(`verify:email:${verificationToken}`, user.id, 86400);

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/verify-email`;
    await this.emailQueue.add(QueueNames.EMAIL, {
      type: EmailJobTypes.SEND_NOTIFICATION,
      to: user.email,
      subject: 'Verify your email - TRADINGO',
      template: 'email-verification',
      context: { name: user.name, verificationToken, verificationUrl },
    });

    return { message: 'Verification email sent', expiresIn: 86400 };
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

    // Atomic two-phase rotation: mark inactive first, then create new
    const now = new Date();
    const deactivated = await this.prisma.session.updateMany({
      where: { id: payload.sessionId, isActive: true },
      data: { isActive: false },
    });

    // If 0 rows affected → already rotated (race condition defeated)
    if (deactivated.count === 0) {
      throw new UnauthorizedException('Session already refreshed');
    }

    const oldSession = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!oldSession?.user) {
      throw new UnauthorizedException('Session not found');
    }

    if (oldSession.expiresAt < now) {
      throw new UnauthorizedException('Session expired');
    }

    const tokens = await this.generateTokens(
      oldSession.user.id,
      oldSession.user.email,
      oldSession.user.role,
      oldSession.user.permissions,
    );
    await this.saveRefreshToken(oldSession.user.id, tokens.refreshToken, tokens.sessionId, oldSession.userAgent, oldSession.ipAddress);

    this.logger.log(`Token refreshed for user: ${oldSession.user.id}, new session: ${tokens.sessionId}`);

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
        await this.prisma.session.update({
          where: { id: payload.sessionId },
          data: { isActive: false },
        });
      } catch {
        // If token is invalid, deactivate all sessions for user
        await this.prisma.session.updateMany({
          where: { userId },
          data: { isActive: false },
        });
      }
    } else {
      await this.prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    // Evict Redis JWT cache for this user
    await this.redisService.del(`user:active:${userId}`);
  }

  private async handleFailedLogin(identifier: string, ipAddress?: string) {
    const key = `lock:user:${identifier}`;
    const attempts = await this.redisService.incr(key);

    if (attempts === 1) {
      await this.redisService.expire(key, LOCK_WINDOW_SECONDS);
    }

    const user = await this.findUserByIdentifier(identifier);

    await this.auditLog.create({
      userId: user?.id,
      action: 'SECURITY_LOGIN_FAILURE',
      resource: `auth/login/${identifier}`,
      metadata: { attempt: attempts, identifier, userFound: !!user },
      ipAddress,
    });

    this.eventEmitter.emit('security.login.failed', {
      userId: user?.id,
      action: 'SECURITY_LOGIN_FAILURE',
      resource: `auth/login/${identifier}`,
      metadata: { attempt: attempts, identifier, userFound: !!user },
      ipAddress,
    });

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.redisService.expire(key, LOCK_DURATION_MINUTES * 60);

      // Also lock in DB if user exists
      if (user) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts, lockedUntil },
        });
      }

      if (user) {
        this.notification.create(user.id, {
          userId: user.id,
          type: 'SYSTEM_ANNOUNCEMENT' as any,
          channel: 'IN_APP',
          title: 'Account Locked',
          body: `Your account has been locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts. Please try again after ${LOCK_DURATION_MINUTES} minutes or reset your password.`,
          metadata: { reason: 'multiple_failed_logins', lockDurationMinutes: LOCK_DURATION_MINUTES } as any,
          sourceModule: 'auth',
        }).catch((err) => this.logger.error('Failed to send lock notification', err));
      }

      await this.auditLog.create({
        userId: user?.id,
        action: 'SECURITY_ACCOUNT_LOCKED',
        resource: `auth/lock/${identifier}`,
        metadata: { reason: 'max_login_attempts', attempts, lockDurationMinutes: LOCK_DURATION_MINUTES, identifier },
        ipAddress,
      });

      this.logger.warn(`Account locked: ${identifier} for ${LOCK_DURATION_MINUTES} minutes`);
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

  private async saveRefreshToken(userId: string, refreshToken: string, sessionId: string, userAgent?: string | null, ipAddress?: string | null) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        refreshToken: this.hashToken(refreshToken),
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        isActive: true,
        lastUsedAt: new Date(),
        expiresAt,
      },
    });
  }

  // ── OTP Login ──
  async sendLoginOtp(identifier: string, ipAddress?: string) {
    const ipKey = `otp:ip:${ipAddress || 'unknown'}:send`;
    const ipCount = await this.redisService.incr(ipKey);
    if (ipCount === 1) await this.redisService.expire(ipKey, 60);
    if (ipCount > 10) {
      this.logger.warn(`OTP rate limit exceeded for IP: ${ipAddress}`);
      return { success: true, message: 'If account exists, OTP sent', expiresIn: 300 };
    }

    const lockKey = `lock:user:${identifier}`;
    if (await this.redisService.exists(lockKey)) {
      return { success: true, message: 'If account exists, OTP sent', expiresIn: 300 };
    }
    const user = await this.findUserByIdentifier(identifier);
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      return { success: true, message: 'If account exists, OTP sent', expiresIn: 300 };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`login:otp:${identifier}`, otp, 300);
    const isPhone = /^\+?[1-9]\d{9,14}$/.test(identifier);
    if (isPhone) {
      await this.smsService.sendOtp(identifier, otp, 'OTP_LOGIN');
    } else {
      await this.emailQueue.add(QueueNames.EMAIL, {
        type: EmailJobTypes.SEND_NOTIFICATION,
        to: identifier,
        subject: 'Your Login OTP',
        template: 'otp-login',
        context: { name: user?.name || identifier, otp },
      }).catch((err) => this.logger.warn(`Failed to queue login OTP email: ${(err as Error).message}`));
    }
    return { success: true, message: 'If account exists, OTP sent', expiresIn: 300 };
  }

  async loginWithOtp(b: { identifier: string; otp: string; rememberMe?: boolean }) {
    const stored = await this.redisService.get(`login:otp:${b.identifier}`);
    if (!stored || stored !== b.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redisService.del(`login:otp:${b.identifier}`);

    const user = await this.findUserByIdentifier(b.identifier);
    if (!user) throw new UnauthorizedException('Account not found');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  // ── Forgot Password ──
  async sendResetOtp(identifier: string, ipAddress?: string) {
    const ipKey = `otp:ip:${ipAddress || 'unknown'}:send`;
    const ipCount = await this.redisService.incr(ipKey);
    if (ipCount === 1) await this.redisService.expire(ipKey, 60);
    if (ipCount > 10) {
      this.logger.warn(`OTP rate limit exceeded for IP: ${ipAddress}`);
      return { success: true, message: 'If account exists, reset OTP sent', expiresIn: 300 };
    }

    const lockKey = `lock:user:${identifier}`;
    if (await this.redisService.exists(lockKey)) {
      return { success: true, message: 'If account exists, reset OTP sent', expiresIn: 300 };
    }
    const user = await this.findUserByIdentifier(identifier);
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      return { success: true, message: 'If account exists, reset OTP sent', expiresIn: 300 };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`reset:otp:${identifier}`, otp, 300);
    const isPhone = /^\+?[1-9]\d{9,14}$/.test(identifier);
    if (isPhone) {
      await this.smsService.sendOtp(identifier, otp, 'OTP_RESET_PASSWORD');
    } else {
      await this.emailQueue.add(QueueNames.EMAIL, {
        type: EmailJobTypes.SEND_PASSWORD_RESET,
        to: identifier,
        subject: 'Password Reset OTP',
        template: 'password-reset',
        context: { name: user?.name || identifier, otp },
      }).catch((err) => this.logger.warn(`Failed to queue password reset OTP email: ${(err as Error).message}`));
    }
    return { success: true, message: 'If account exists, reset OTP sent', expiresIn: 300 };
  }

  async verifyResetOtp(b: { identifier: string; otp: string }) {
    const stored = await this.redisService.get(`reset:otp:${b.identifier}`);
    if (!stored || stored !== b.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const resetToken = randomBytes(32).toString('hex');
    await this.redisService.set(`reset:token:${resetToken}`, b.identifier, 600);
    return { success: true, resetToken };
  }

  async resetPassword(b: { resetToken: string; newPassword: string }) {
    const identifier = await this.redisService.get(`reset:token:${b.resetToken}`);
    if (!identifier) throw new UnauthorizedException('Invalid or expired reset token');

    const user = await this.findUserByIdentifier(identifier);
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(b.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, loginAttempts: 0, lockedUntil: null },
    });

    await this.redisService.del(`reset:token:${b.resetToken}`);
    await this.redisService.del(`lock:user:${identifier}`);

    // Invalidate Redis JWT cache — forces re-authentication after password reset
    await this.redisService.del(`user:active:${user.id}`);

    this.logger.log(`Password reset complete for ${identifier}`);
    return { success: true, message: 'Password reset successfully' };
  }

  // ── Social Login Callback ──
  async socialLoginCallback(user: any, res: any) {
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const redirectUrl = new URL('/login?socialLogin=true', frontendUrl);

    // Set secure HTTP-only cookie for the access token
    res.setCookie('accessToken', tokens.accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    // Set refresh token as HTTP-only cookie too
    res.setCookie('refreshToken', tokens.refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res.redirect(redirectUrl.toString());
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

  async registerVendor(dto: CreateVendorDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingEmail = await tx.user.findUnique({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }

      const existingPan = await tx.company.findFirst({ where: { panNumber: dto.panNumber } });
      if (existingPan) {
        throw new ConflictException('PAN number already registered');
      }

      if (!dto.password) {
        throw new BadRequestException('Password is required to create a new vendor account');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.ownerName,
          mobile: dto.mobileNumber || null,
          role: 'BUYER',
        },
      });

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
      await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

      await this.emailQueue.add(QueueNames.EMAIL, {
        type: EmailJobTypes.SEND_WELCOME_EMAIL,
        to: user.email,
        subject: 'Welcome to TRADINGO',
        template: 'welcome',
        context: { name: dto.ownerName, businessName: dto.businessName },
      });

      this.logger.log(`Vendor account created (Buyer role): ${dto.email}`);

      return {
        success: true,
        message: 'Account created. Your seller capability activates on completing vendor onboarding.',
        userId: user.id,
        role: 'BUYER',
        ...tokens,
      };
    });
  }

  // ── Company identity normalization (F2) ─────────────────────────────────
  // The vendor wizard collects a legal structure (sole_proprietorship, private_limited, ...)
  // as `businessType` and a marketplace activity (manufacturer, wholesaler, ...) as `sellerType`.
  // The Company model separates these concepts: businessType holds the activity taxonomy,
  // companyStructure holds the legal structure. Normalize once, server-side.
  private normalizeCompanyIdentity(dto: CreateVendorDto) {
    const structureMap: Record<string, CompanyStructure> = {
      sole_proprietorship: CompanyStructure.SOLE_PROPRIETORSHIP,
      partnership: CompanyStructure.PARTNERSHIP,
      private_limited: CompanyStructure.PRIVATE_LIMITED,
      llp: CompanyStructure.LLP,
      public_limited: CompanyStructure.PUBLIC_LIMITED,
      huf: CompanyStructure.HUF,
      trust: CompanyStructure.TRUST,
      other: CompanyStructure.OTHER,
    };
    const sellerToBusiness: Record<string, BusinessType> = {
      manufacturer: BusinessType.MANUFACTURER,
      wholesaler: BusinessType.WHOLESALER,
      distributor: BusinessType.DISTRIBUTOR,
      retailer: BusinessType.RETAILER,
      service_provider: BusinessType.SERVICE_PROVIDER,
    };

    const structureKey = (dto.businessType || '').trim().toLowerCase();
    const structure = structureMap[structureKey] || null;
    const businessType = sellerToBusiness[(dto.sellerType || '').trim().toLowerCase()] || null;
    return { businessType, companyStructure: structure };
  }

  private async createVendorCompany(userId: string, dto: CreateVendorDto, tx: Prisma.TransactionClient) {
    const slug = dto.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const { businessType, companyStructure } = this.normalizeCompanyIdentity(dto);

    const company = await tx.company.create({
      data: {
        name: dto.businessName,
        slug,
        businessType,
        companyStructure,
        panNumber: dto.panNumber,
        gstNumber: dto.gstNumber || null,
        website: dto.website || null,
        email: dto.email,
        mobile: dto.mobileNumber,
        description: dto.description,
        createdBy: userId,
        updatedBy: userId,
        onboardingStatus: 'ACCOUNT_CREATED',
        onboardingStartedAt: new Date(),
        logo: dto.logoUrl || null,
        banner: dto.bannerUrl || null,
        registrationDocuments: this.buildRegistrationDocuments(dto),
      },
    });

    await tx.companyOwner.create({
      data: { companyId: company.id, userId, isPrimary: true },
    });

    await tx.companyLocation.create({
      data: {
        companyId: company.id,
        type: 'HEAD_OFFICE',
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2 || null,
        city: dto.city,
        district: dto.district || null,
        state: dto.state,
        pincode: dto.pincode,
        isPrimary: true,
      },
    });

    return company;
  }

  // F6/F7 — ONE legal company: upgrade an existing owned business (e.g. a TradeServ
  // professional company) to a full seller capability instead of creating a second
  // company for the same legal entity (identified by matching PAN/GST).
  // VENDOR-REG-002 — collect the optional uploaded document URLs into a single
  // JSON column. Optional: any missing URL is simply omitted.
  private buildRegistrationDocuments(dto: CreateVendorDto): Prisma.InputJsonValue | undefined {
    const docs: Record<string, string> = {};
    if (dto.panCardUrl) docs.panCardUrl = dto.panCardUrl;
    if (dto.gstCertificateUrl) docs.gstCertificateUrl = dto.gstCertificateUrl;
    if (dto.cancelledChequeUrl) docs.cancelledChequeUrl = dto.cancelledChequeUrl;
    if (dto.logoUrl) docs.logoUrl = dto.logoUrl;
    if (dto.bannerUrl) docs.bannerUrl = dto.bannerUrl;
    return Object.keys(docs).length ? (docs as Prisma.InputJsonValue) : undefined;
  }

  private mergeRegistrationDocuments(
    existing: Prisma.InputJsonValue | null,
    dto: CreateVendorDto,
  ): Prisma.InputJsonValue | undefined {
    const base = existing && typeof existing === 'object' ? { ...(existing as Record<string, unknown>) } : {};
    if (dto.panCardUrl) base.panCardUrl = dto.panCardUrl;
    if (dto.gstCertificateUrl) base.gstCertificateUrl = dto.gstCertificateUrl;
    if (dto.cancelledChequeUrl) base.cancelledChequeUrl = dto.cancelledChequeUrl;
    if (dto.logoUrl) base.logoUrl = dto.logoUrl;
    if (dto.bannerUrl) base.bannerUrl = dto.bannerUrl;
    return Object.keys(base).length ? (base as Prisma.InputJsonValue) : undefined;
  }

  private async upgradeCompanyToVendor(
    company: Company,
    userId: string,
    dto: CreateVendorDto,
    tx: Prisma.TransactionClient,
  ) {
    const { businessType, companyStructure } = this.normalizeCompanyIdentity(dto);

    const updated = await tx.company.update({
      where: { id: company.id },
      data: {
        // A professional firm keeps its professional classification; buyer-type
        // or missing businessType is replaced by the vendor form's normalized value.
        businessType: company.businessType === 'PROFESSIONAL' ? company.businessType : businessType,
        companyStructure,
        panNumber: company.panNumber || dto.panNumber,
        gstNumber: company.gstNumber || dto.gstNumber || null,
        website: company.website || dto.website || null,
        email: company.email || dto.email,
        mobile: company.mobile || dto.mobileNumber,
        description: company.description || dto.description,
        logo: company.logo || dto.logoUrl || null,
        banner: company.banner || dto.bannerUrl || null,
        registrationDocuments: this.mergeRegistrationDocuments(company.registrationDocuments as Prisma.InputJsonValue | null, dto),
        updatedBy: userId,
        onboardingStatus: 'ACCOUNT_CREATED',
        onboardingStartedAt: company.onboardingStartedAt || new Date(),
        status: 'ACTIVE',
      },
    });

    const existingLocation = await tx.companyLocation.findFirst({
      where: { companyId: company.id, isPrimary: true },
    });
    if (!existingLocation) {
      await tx.companyLocation.create({
        data: {
          companyId: company.id,
          type: 'HEAD_OFFICE',
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 || null,
          city: dto.city,
          district: dto.district || null,
          state: dto.state,
          pincode: dto.pincode,
          isPrimary: true,
        },
      });
    }

    return updated;
  }

  async vendorOnboarding(userId: string, dto: CreateVendorDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ownedCompanies = await this.prisma.companyOwner.findMany({
      where: { userId: user.id },
      include: { company: true },
    });
    ownedCompanies.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

    if (user.role === 'SELLER') {
      throw new ConflictException('Vendor capability is already active on this account');
    }

    // F6/F7 — ONE legal company: if the account already owns a business (e.g. a
    // TradeServ professional company) and its PAN/GST matches the onboarding form,
    // REUSE it instead of creating a second company for the same legal entity.
    // A company that has never declared identity data (e.g. a buyer-registered
    // company) is not in conflict: the onboarding form is its first identity
    // declaration and upgrades the existing company in place.
    const match = ownedCompanies.find(
      (o) =>
        (o.company.panNumber &&
          dto.panNumber &&
          o.company.panNumber.toUpperCase() === dto.panNumber.toUpperCase()) ||
        (o.company.gstNumber &&
          dto.gstNumber &&
          o.company.gstNumber.toUpperCase() === dto.gstNumber.toUpperCase()),
    );
    const identityDeclarers = ownedCompanies.filter((o) => o.company.panNumber || o.company.gstNumber);
    const identityConflict = ownedCompanies.length > 0 && !match && identityDeclarers.length > 0;

    if (identityConflict) {
      throw new ConflictException('A business is already linked to this account');
    }

    if (!ownedCompanies.length) {
      const existingPan = await this.prisma.company.findFirst({ where: { panNumber: dto.panNumber } });
      if (existingPan) {
        throw new ConflictException('PAN number already registered');
      }
    }

    const { company, updated } = await this.prisma.$transaction(async (tx) => {
      let company: Company;
      if (match) {
        company = await this.upgradeCompanyToVendor(match.company, user.id, dto, tx);
      } else if (ownedCompanies.length > 0) {
        company = await this.upgradeCompanyToVendor(ownedCompanies[0].company, user.id, dto, tx);
      } else {
        company = await this.createVendorCompany(user.id, dto, tx);
      }

      if (dto.planId) {
        await this.membership.enrollTrial(company.id, dto.planId, tx);
      }

      if (dto.referralCode) {
        await this.vendorCodes.assignReferral(company.id, dto.referralCode, tx);
      }

      if (dto.rmCode) {
        const owner = await this.vendorCodes.getCodeOwner(dto.rmCode);
        if (!owner || (owner.type !== 'RM' && owner.type !== 'ME')) {
          throw new ConflictException('Invalid RM code');
        }
        if (!company.assignedRmId) {
          await tx.company.update({
            where: { id: company.id },
            data: { assignedRmId: owner.userId, assignedAt: new Date() },
          });
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: 'ASSIGN_RM',
              resource: `company:${company.id}`,
              metadata: { rmUserId: owner.userId, source: 'registration' } as any,
              ipAddress: null,
            },
          });
        } else {
          this.logger.warn(`RM assignment skipped for company ${company.id}: RM already assigned`);
        }
      }

      if (dto.accountNumber && dto.ifscCode) {
        await tx.sellerPayoutAccount.upsert({
          where: { companyId: company.id },
          create: { companyId: company.id, bankAccount: dto.accountNumber, ifscCode: dto.ifscCode },
          update: {},
        });
      }

      // F-07: cascade-picked canonical IDs are authoritative when present;
      // otherwise the F-06 fail-closed name path applies unchanged.
      if (dto.primaryCatalogCategoryId || (dto.secondaryCatalogCategoryIds || []).length > 0) {
        await this.linkCompanyCanonicalCategories(
          company.id,
          [dto.primaryCatalogCategoryId, ...(dto.secondaryCatalogCategoryIds || [])],
          tx,
        );
      } else {
        await this.linkCompanyCategories(company.id, [dto.primaryCategory, ...(dto.secondaryCategories || [])], tx);
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { role: 'SELLER', mobile: user.mobile || dto.mobileNumber || null },
        select: { id: true, email: true, name: true, role: true, permissions: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'VENDOR_ONBOARDING_COMPLETED',
          resource: `user:${user.id}`,
          metadata: { newRole: 'SELLER', oldRole: user.role, companyId: company.id } as any,
          ipAddress: null,
        },
      });

      return { company, updated };
    });

    this.eventEmitter.emit('vendor.capability.activated', {
      userId: user.id,
      companyId: company.id,
      newRole: 'SELLER',
      oldRole: user.role,
    });

    this.notification.create(user.id, {
      userId: user.id,
      type: 'SYSTEM_ANNOUNCEMENT' as any,
      channel: 'IN_APP',
      title: 'Vendor Mode Activated',
      body: 'Your seller workspace is now active. Your buyer features remain available.',
      metadata: { companyId: company.id } as any,
      sourceModule: 'auth',
    }).catch((err) => this.logger.error('Failed to send vendor activation notification', err));

    const tokens = await this.generateTokens(user.id, user.email, updated.role, updated.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    await this.emailQueue.add(QueueNames.EMAIL, {
      type: EmailJobTypes.SEND_WELCOME_EMAIL,
      to: user.email,
      subject: 'Welcome to TRADINGO Seller',
      template: 'welcome',
      context: { name: user.name, businessName: dto.businessName },
    });

    this.logger.log(`Vendor capability activated: ${user.email} → Company: ${company.id}`);

    return {
      success: true,
      message: 'Vendor mode activated. Your buyer features remain available.',
      userId: user.id,
      companyId: company.id,
      ...tokens,
    };
  }

  async registerBuyer(dto: CreateBuyerDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const { user, company } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.fullName,
          mobile: dto.mobileNumber || null,
          role: 'BUYER',
        },
      });

      const slug = dto.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

      const buyerStructureMap: Record<string, CompanyStructure> = {
        individual: CompanyStructure.SOLE_PROPRIETORSHIP,
        sole_proprietorship: CompanyStructure.SOLE_PROPRIETORSHIP,
        partnership: CompanyStructure.PARTNERSHIP,
        private_limited: CompanyStructure.PRIVATE_LIMITED,
        llp: CompanyStructure.LLP,
        public_limited: CompanyStructure.PUBLIC_LIMITED,
        huf: CompanyStructure.HUF,
        trust: CompanyStructure.TRUST,
        other: CompanyStructure.OTHER,
      };
      const buyerStructureKey = (dto.businessType || '').trim().toLowerCase();
      const buyerCompanyStructure = buyerStructureMap[buyerStructureKey] || null;
      const buyerBusinessType = Object.values(BusinessType).includes(dto.businessType.toUpperCase() as BusinessType)
        ? (dto.businessType.toUpperCase() as BusinessType)
        : null;

      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          slug,
          businessType: buyerBusinessType,
          companyStructure: buyerCompanyStructure,
          gstNumber: dto.gstNumber || null,
          website: dto.website || null,
          email: dto.email,
          mobile: dto.mobileNumber,
          description: `${dto.industry} buyer. ${dto.companySize} employees. Annual procurement: ${dto.annualProcurement}.`,
          createdBy: user.id,
          updatedBy: user.id,
          onboardingStatus: 'ACCOUNT_CREATED',
          onboardingStartedAt: new Date(),
        },
      });

      await tx.companyOwner.create({
        data: { companyId: company.id, userId: user.id, isPrimary: true },
      });

      await tx.companyLocation.create({
        data: {
          companyId: company.id,
          type: 'HEAD_OFFICE',
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 || null,
          city: dto.city,
          district: dto.district || null,
          state: dto.state,
          pincode: dto.pincode,
          isPrimary: true,
        },
      });

      await this.linkCompanyCategories(company.id, dto.primaryCategories || [], tx);

      await this.notification.initializeDefaultPreferences(company.id, user.id, tx);
      await this.notification.upsertPreference(company.id, user.id, {
        channel: 'EMAIL',
        type: NotificationType.GENERIC,
        enabled: dto.notificationEmail,
      }, tx);
      await this.notification.upsertPreference(company.id, user.id, {
        channel: 'SMS',
        type: NotificationType.GENERIC,
        enabled: dto.notificationSms,
      }, tx);

      if (dto.newsletter) {
        await tx.newsletterSubscriber.upsert({
          where: { email: user.email },
          create: { email: user.email, name: dto.fullName, companyId: company.id, status: 'ACTIVE' },
          update: { status: 'ACTIVE', companyId: company.id },
        });
      }

      return { user, company };
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    await this.emailQueue.add(QueueNames.EMAIL, {
      type: EmailJobTypes.SEND_WELCOME_EMAIL,
      to: user.email,
      subject: 'Welcome to TRADINGO',
      template: 'welcome',
      context: { name: dto.fullName, companyName: dto.companyName },
    });

    this.logger.log(`Buyer registered: ${dto.email} → Company: ${company.id}`);

    return {
      success: true,
      message: 'Registration successful. Start exploring products!',
      userId: user.id,
      companyId: company.id,
      ...tokens,
    };
  }

  async verifyPan(panNumber: string) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      throw new BadRequestException('Invalid PAN format');
    }

    // Config-gated provider integration. No fabricated results: without configured
    // credentials the service answers honestly that verification is unavailable.
    const providerUrl = this.configService.get<string>('PAN_VERIFY_API_URL');
    const providerKey = this.configService.get<string>('PAN_VERIFY_API_KEY');
    if (!providerUrl || !providerKey) {
      return {
        verified: false,
        panNumber,
        message: 'PAN verification service is not configured. Contact support to verify your PAN.',
      };
    }

    this.logger.log('PAN verification requested via provider');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': providerKey,
        },
        body: JSON.stringify({ pan: panNumber }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 404) {
        return { verified: false, panNumber, message: 'PAN not found in records' };
      }
      if (res.status === 429) {
        throw new HttpException('PAN verification provider rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (!res.ok) {
        throw new HttpException('PAN verification provider error', HttpStatus.BAD_GATEWAY);
      }

      const data = (await res.json()) as Record<string, unknown>;
      const isVerified = data && data.verified === true;
      const holderName = isVerified ? (data.holderName ?? data.name ?? null) : null;
      return {
        verified: isVerified,
        panNumber,
        holderName,
        message: isVerified ? 'PAN verified successfully' : (data.message as string) || 'PAN verification failed',
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const aborted = err instanceof Error && err.name === 'AbortError';
      throw new HttpException(
        aborted ? 'PAN verification provider timed out' : 'PAN verification provider unreachable',
        aborted ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async verifyGst(gstNumber: string) {
    if (gstNumber.length !== 15) {
      throw new BadRequestException('GSTIN must be 15 characters');
    }

    // Config-gated provider integration. No fabricated results: without configured
    // credentials the service answers honestly that verification is unavailable.
    const providerUrl = this.configService.get<string>('GST_VERIFY_API_URL');
    const providerKey = this.configService.get<string>('GST_VERIFY_API_KEY');
    if (!providerUrl || !providerKey) {
      return {
        verified: false,
        gstNumber,
        message: 'GST verification service is not configured. Contact support to verify your GST.',
      };
    }

    this.logger.log('GST verification requested via provider');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': providerKey,
        },
        body: JSON.stringify({ gstin: gstNumber }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 404) {
        return { verified: false, gstNumber, message: 'GSTIN not found in records' };
      }
      if (res.status === 429) {
        throw new HttpException('GST verification provider rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (!res.ok) {
        throw new HttpException('GST verification provider error', HttpStatus.BAD_GATEWAY);
      }

      const data = (await res.json()) as Record<string, unknown>;
      const isVerified = data && data.verified === true;
      return {
        verified: isVerified,
        gstNumber,
        businessName: isVerified ? (data.businessName ?? data.tradeName ?? null) : null,
        address: isVerified ? (data.address ?? null) : null,
        state: isVerified ? (data.state ?? null) : null,
        registrationDate: isVerified ? (data.registrationDate ?? null) : null,
        message: isVerified ? 'GST verified successfully' : (data.message as string) || 'GST verification failed',
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const aborted = err instanceof Error && err.name === 'AbortError';
      throw new HttpException(
        aborted ? 'GST verification provider timed out' : 'GST verification provider unreachable',
        aborted ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async verifyIfsc(ifscCode: string) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
      throw new BadRequestException('Invalid IFSC format');
    }

    const { fetchWithTimeout, DEFAULT_TIMEOUTS } = await import('../../common/utils/timeout');

    try {
      const response = await fetchWithTimeout(
        `https://ifsc.razorpay.com/${ifscCode}`,
        { timeout: DEFAULT_TIMEOUTS.razorpay },
        'ifsc-verification',
      );

      if (response.status === 404) {
        return {
          verified: false,
          ifscCode,
          message: 'IFSC not found',
        };
      }

      if (response.status === 429) {
        throw new HttpException('IFSC verification rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
      }

      if (!response.ok) {
        this.logger.warn(`IFSC API returned status ${response.status} for ${ifscCode}`);
        throw new HttpException('IFSC verification service is temporarily unavailable. Please try again.', HttpStatus.BAD_GATEWAY);
      }

      const data = await response.json();

      if (!data || typeof data.BANK !== 'string') {
        this.logger.warn(`IFSC API returned unexpected shape for ${ifscCode}`);
        throw new HttpException('IFSC verification service returned an unexpected response. Please try again.', HttpStatus.BAD_GATEWAY);
      }

      return {
        verified: true,
        ifscCode: data.IFSC || ifscCode,
        bankName: data.BANK,
        branch: data.BRANCH ?? '',
        address: data.ADDRESS ?? '',
        state: data.STATE ?? '',
        city: data.CITY ?? '',
        message: 'IFSC verified successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as Error).name === 'TimeoutError') {
        throw new HttpException('IFSC verification timed out. Please try again.', HttpStatus.GATEWAY_TIMEOUT);
      }
      this.logger.error(`IFSC verification failed for ${ifscCode}: ${(error as Error).message}`);
      throw new HttpException('IFSC verification service is temporarily unavailable. Please try again.', HttpStatus.BAD_GATEWAY);
    }
  }

  async sendOtp(type: 'mobile' | 'email', value: string, ipAddress?: string) {
    const ipKey = `otp:ip:${ipAddress || 'unknown'}:send`;
    const ipCount = await this.redisService.incr(ipKey);
    if (ipCount === 1) await this.redisService.expire(ipKey, 60);
    if (ipCount > 10) {
      this.logger.warn(`OTP rate limit exceeded for IP: ${ipAddress}`);
      return { success: true, message: `OTP sent to ${value}`, expiresIn: 300 };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${type}:${value}`;

    await this.redisService.set(key, otp, 300); // 5 min expiry

    if (type === 'mobile') {
      await this.smsService.sendOtp(value, otp, 'OTP_VERIFY_MOBILE');
    } else {
      await this.emailQueue.add(QueueNames.EMAIL, {
        type: EmailJobTypes.SEND_NOTIFICATION,
        to: value,
        subject: 'Your Verification OTP',
        template: 'otp-verify',
        context: { name: value, otp, type: 'Email' },
      }).catch((err) => this.logger.warn(`Failed to queue verification OTP email: ${(err as Error).message}`));
    }
    return { success: true, message: `OTP sent to ${value}`, expiresIn: 300 };
  }

  async verifyOtp(type: 'mobile' | 'email', value: string, otp: string) {
    const key = `otp:${type}:${value}`;
    const stored = await this.redisService.get(key);

    if (!stored || stored !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redisService.del(key);
    return { verified: true, message: `${type} verified successfully` };
  }
}
