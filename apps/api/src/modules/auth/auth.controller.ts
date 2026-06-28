import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Headers, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/vendor')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerVendor(@Body() dto: CreateVendorDto) {
    return this.authService.registerVendor(dto);
  }

  @Post('register/buyer')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerBuyer(@Body() dto: CreateBuyerDto) {
    return this.authService.registerBuyer(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Req() req?: FastifyRequest,
  ) {
    const ip = req?.ip;
    return this.authService.login(dto, userAgent, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @Post('verify-pan')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyPan(@Body('panNumber') panNumber: string) {
    return this.authService.verifyPan(panNumber);
  }

  @Post('verify-gst')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyGst(@Body('gstNumber') gstNumber: string) {
    return this.authService.verifyGst(gstNumber);
  }

  @Post('verify-ifsc')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyIfsc(@Body('ifscCode') ifscCode: string) {
    return this.authService.verifyIfsc(ifscCode);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendOtp(@Body() body: { type: 'mobile' | 'email'; value: string }) {
    return this.authService.sendOtp(body.type, body.value);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyOtp(@Body() body: { type: 'mobile' | 'email'; value: string; otp: string }) {
    return this.authService.verifyOtp(body.type, body.value, body.otp);
  }

  // ── OTP Login ──
  @Post('send-login-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendLoginOtp(@Body() b: { identifier: string }) {
    return this.authService.sendLoginOtp(b.identifier);
  }

  @Post('login-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async loginWithOtp(@Body() b: { identifier: string; otp: string; rememberMe?: boolean }) {
    return this.authService.loginWithOtp(b);
  }

  // ── Forgot Password ──
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() b: { identifier: string }) {
    return this.authService.sendResetOtp(b.identifier);
  }

  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyResetOtp(@Body() b: { identifier: string; otp: string }) {
    return this.authService.verifyResetOtp(b);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() b: { resetToken: string; newPassword: string }) {
    return this.authService.resetPassword(b);
  }

  // ── Google OAuth ──
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: FastifyReply) {
    return this.authService.socialLoginCallback(req.user, res);
  }

  // ── LinkedIn OAuth ──
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedInAuth() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedInCallback(@Req() req: any, @Res() res: FastifyReply) {
    return this.authService.socialLoginCallback(req.user, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser('sub') userId: string,
    @Body('refreshToken') refreshToken?: string,
  ) {
    await this.authService.logout(userId, refreshToken);
  }
}
