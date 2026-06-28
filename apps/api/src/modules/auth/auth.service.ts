import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateBuyerDto } from './dto/create-buyer.dto';
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
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

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

  private async findUserByIdentifier(identifier: string) {
    const cleanMobile = identifier.replace(/^\+91|\s/g, '');
    const panUpper = identifier.toUpperCase();
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { mobile: cleanMobile },
          { panNumber: panUpper },
        ],
      },
    });
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const lockKey = `lock:user:${dto.identifier}`;
    if (await this.redisService.exists(lockKey)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user || !user.isActive) {
      await this.handleFailedLogin(dto.identifier);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Role check
    if (dto.role && dto.role !== 'any') {
      const roleMap: Record<string,string[]> = {
        buyer:  ['buyer', 'VIEWER'],
        vendor: ['vendor','seller','MANAGER'],
        admin:  ['admin','super_admin','rm','SUPER_ADMIN','ADMIN'],
      };
      if (!roleMap[dto.role]?.includes(user.role as string))
        throw new UnauthorizedException('This account is not a ' + dto.role + ' account');
    }

    // Status checks (using isActive + lockedUntil for now)
    if (!user.isActive)
      throw new ForbiddenException('Account suspended. Contact support@tradingo.in');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.handleFailedLogin(dto.identifier);
      throw new UnauthorizedException('Incorrect password');
    }

    // Reset login attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });
    await this.redisService.del(lockKey);

    if (userAgent) {
      await this.prisma.session.deleteMany({
        where: { userId: user.id, userAgent },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, userAgent, ipAddress);

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
    await this.saveRefreshToken(session.user.id, tokens.refreshToken, tokens.sessionId, session.userAgent, session.ipAddress);

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
        expiresAt,
      },
    });
  }

  // ── OTP Login ──
  async sendLoginOtp(identifier: string) {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) throw new NotFoundException('Account not found with this identifier');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`login:otp:${identifier}`, otp, 300);
    this.logger.log(`Login OTP for ${identifier}: ${otp} (dev: accept 123456)`);
    return { success: true, message: 'OTP sent successfully', expiresIn: 300 };
  }

  async loginWithOtp(b: { identifier: string; otp: string; rememberMe?: boolean }) {
    const devOtp = '123456';
    if (b.otp !== devOtp) {
      const stored = await this.redisService.get(`login:otp:${b.identifier}`);
      if (!stored || stored !== b.otp) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
      await this.redisService.del(`login:otp:${b.identifier}`);
    }

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
  async sendResetOtp(identifier: string) {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) throw new NotFoundException('Account not found with this identifier');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`reset:otp:${identifier}`, otp, 300);
    this.logger.log(`Reset OTP for ${identifier}: ${otp} (dev: accept 123456)`);
    return { success: true, message: 'Reset OTP sent', expiresIn: 300 };
  }

  async verifyResetOtp(b: { identifier: string; otp: string }) {
    const devOtp = '123456';
    if (b.otp !== devOtp) {
      const stored = await this.redisService.get(`reset:otp:${b.identifier}`);
      if (!stored || stored !== b.otp) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
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
    this.logger.log(`Password reset complete for ${identifier}`);
    return { success: true, message: 'Password reset successfully' };
  }

  // ── Social Login Callback ──
  async socialLoginCallback(user: any, res: any) {
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    const redirectUrl = `https://tradingo.in/login?socialLogin=true&accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    return res.redirect(redirectUrl);
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
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingPan = await this.prisma.company.findFirst({ where: { panNumber: dto.panNumber } });
    if (existingPan) {
      throw new ConflictException('PAN number already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.ownerName,
        role: 'VIEWER',
      },
    });

    const slug = dto.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const company = await this.prisma.company.create({
      data: {
        name: dto.businessName,
        slug,
        businessType: dto.businessType as any,
        panNumber: dto.panNumber,
        gstNumber: dto.gstNumber || null,
        website: dto.website || null,
        email: dto.email,
        mobile: dto.mobileNumber,
        description: dto.description,
        createdBy: user.id,
        updatedBy: user.id,
        onboardingStatus: 'ACCOUNT_CREATED',
        onboardingStartedAt: new Date(),
      },
    });

    await this.prisma.companyOwner.create({
      data: { companyId: company.id, userId: user.id, isPrimary: true },
    });

    await this.prisma.companyLocation.create({
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

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions);
    await this.saveRefreshToken(user.id, tokens.refreshToken, tokens.sessionId, null, null);

    await this.emailQueue.add(QueueNames.EMAIL, {
      type: EmailJobTypes.SEND_WELCOME_EMAIL,
      to: user.email,
      subject: 'Welcome to TRADINGO',
      template: 'welcome',
      context: { name: dto.ownerName, businessName: dto.businessName },
    });

    this.logger.log(`Vendor registered: ${dto.email} → Company: ${company.id}`);

    return {
      success: true,
      message: 'Registration successful. Your account is under review.',
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
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.fullName,
        role: 'VIEWER',
      },
    });

    const slug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug,
        businessType: dto.businessType as any,
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

    await this.prisma.companyOwner.create({
      data: { companyId: company.id, userId: user.id, isPrimary: true },
    });

    await this.prisma.companyLocation.create({
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

    // In production, integrate with NSDL/UTIITSL PAN verification API
    // Dev/stub: return mock success
    this.logger.log(`PAN verification requested: ${panNumber}`);

    return {
      verified: true,
      panNumber,
      holderName: 'RAJESH KUMAR',
      message: 'PAN verified successfully',
    };
  }

  async verifyGst(gstNumber: string) {
    if (gstNumber.length !== 15) {
      throw new BadRequestException('GSTIN must be 15 characters');
    }

    // In production, integrate with GST portal API
    // Dev/stub: return mock success
    this.logger.log(`GST verification requested: ${gstNumber}`);

    return {
      verified: true,
      gstNumber,
      businessName: 'KUMAR TRADING CO',
      address: '123 Main Road, Patna, Bihar 800001',
      state: 'Bihar',
      registrationDate: '2020-04-01',
      message: 'GST verified successfully',
    };
  }

  async verifyIfsc(ifscCode: string) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
      throw new BadRequestException('Invalid IFSC format');
    }

    // In production, integrate with Razorpay IFSC API
    // Dev/stub: return mock success
    this.logger.log(`IFSC verification requested: ${ifscCode}`);

    return {
      verified: true,
      ifscCode,
      bankName: 'State Bank of India',
      branch: 'Boring Road, Patna',
      address: 'Near Gandhi Maidan, Patna 800001',
      message: 'IFSC verified successfully',
    };
  }

  async sendOtp(type: 'mobile' | 'email', value: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${type}:${value}`;

    await this.redisService.set(key, otp, 300); // 5 min expiry

    this.logger.log(`OTP sent to ${type}: ${value} (dev mode: accept 123456)`);

    // In production, integrate with MSG91 (mobile) or Resend (email)
    return {
      success: true,
      message: `OTP sent to ${value}`,
      expiresIn: 300,
    };
  }

  async verifyOtp(type: 'mobile' | 'email', value: string, otp: string) {
    // Dev mode: accept 123456 as valid OTP
    if (otp === '123456') {
      this.logger.log(`OTP verified (dev mode) for ${type}: ${value}`);
      return { verified: true, message: `${type} verified successfully` };
    }

    const key = `otp:${type}:${value}`;
    const stored = await this.redisService.get(key);

    if (!stored || stored !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redisService.del(key);
    return { verified: true, message: `${type} verified successfully` };
  }
}
