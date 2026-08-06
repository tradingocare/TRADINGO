import { Controller, Post, Get, Delete, Param, Body, HttpCode, HttpStatus, UseGuards, Headers, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyPanDto } from './dto/verify-pan.dto';
import { VerifyGstDto } from './dto/verify-gst.dto';
import { VerifyIfscDto } from './dto/verify-ifsc.dto';
import { ForgotPasswordDto, VerifyResetOtpDto, ResetPasswordDto, SendOtpDto, VerifyOtpDto, LoginOtpDto, VerifyEmailDto, ResendVerificationDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TurnstileGuard } from '../../common/guards/turnstile.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: FastifyReply, refreshToken: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  private clearRefreshTokenCookie(res: FastifyReply): void {
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  }

  @Get('csrf')
  @ApiOperation({ summary: 'Get CSRF token for anonymous state-changing requests' })
  getCsrfToken(@Res({ passthrough: true }) res: FastifyReply) {
    const token = (res as unknown as { generateCsrf?: () => string }).generateCsrf?.() ?? '';
    return { token };
  }

  @Post('register')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Register a new user' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const result = await this.authService.register(dto);
    if (res && 'refreshToken' in result) this.setRefreshTokenCookie(res, (result as any).refreshToken);
    return result;
  }

  @Post('register/vendor')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Register a new vendor' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerVendor(
    @Body() dto: CreateVendorDto,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const result = await this.authService.registerVendor(dto);
    if (res && 'refreshToken' in result) this.setRefreshTokenCookie(res, (result as any).refreshToken);
    return result;
  }

  @Post('register/buyer')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Register a new buyer' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerBuyer(
    @Body() dto: CreateBuyerDto,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const result = await this.authService.registerBuyer(dto);
    if (res && 'refreshToken' in result) this.setRefreshTokenCookie(res, (result as any).refreshToken);
    return result;
  }

  @Post('login')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Login with credentials' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Req() req?: FastifyRequest,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const ip = req?.ip;
    const result = await this.authService.login(dto, userAgent, ip);
    if (res) this.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req?: FastifyRequest,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const bodyToken = dto?.refreshToken;
    const cookieToken = req?.cookies?.refreshToken;
    const refreshToken = cookieToken || bodyToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');
    const tokens = await this.authService.refreshTokens(refreshToken);
    if (res) this.setRefreshTokenCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, dto);
    return { message: 'Password changed successfully' };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get active user sessions' })
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser('sub') userId: string) {
    return this.authService.getSessions(userId);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a user session' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(userId, sessionId);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('verify-pan')
  @ApiOperation({ summary: 'Verify PAN number' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyPan(@Body() dto: VerifyPanDto) {
    return this.authService.verifyPan(dto.panNumber);
  }

  @Post('verify-gst')
  @ApiOperation({ summary: 'Verify GST number' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyGst(@Body() dto: VerifyGstDto) {
    return this.authService.verifyGst(dto.gstNumber);
  }

  @Post('verify-ifsc')
  @ApiOperation({ summary: 'Verify IFSC code' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyIfsc(@Body() dto: VerifyIfscDto) {
    return this.authService.verifyIfsc(dto.ifscCode);
  }

  @Post('send-otp')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Send OTP' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendOtp(@Body() dto: SendOtpDto, @Req() req?: FastifyRequest) {
    return this.authService.sendOtp(dto.type, dto.value, req?.ip);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.type, dto.value, dto.otp);
  }

  @Post('send-login-otp')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Send login OTP' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendLoginOtp(@Body() dto: ForgotPasswordDto, @Req() req?: FastifyRequest) {
    return this.authService.sendLoginOtp(dto.identifier, req?.ip);
  }

  @Post('login-otp')
  @ApiOperation({ summary: 'Login with OTP' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async loginWithOtp(
    @Body() dto: LoginOtpDto,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const result = await this.authService.loginWithOtp(dto);
    if (res && 'refreshToken' in result) this.setRefreshTokenCookie(res, (result as any).refreshToken);
    return result;
  }

  @Post('forgot-password')
  @UseGuards(TurnstileGuard)
  @ApiOperation({ summary: 'Send forgot password OTP' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req?: FastifyRequest) {
    return this.authService.sendResetOtp(dto.identifier, req?.ip);
  }

  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify reset OTP' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: FastifyReply) {
    return this.authService.socialLoginCallback(req.user, res);
  }

  @Get('linkedin')
  @ApiOperation({ summary: 'LinkedIn OAuth login' })
  @UseGuards(AuthGuard('linkedin'))
  linkedInAuth() {}

  @Get('linkedin/callback')
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  @UseGuards(AuthGuard('linkedin'))
  async linkedInCallback(@Req() req: any, @Res() res: FastifyReply) {
    return this.authService.socialLoginCallback(req.user, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser('sub') userId: string,
    @Body('refreshToken') bodyRefreshToken?: string,
    @Req() req?: FastifyRequest,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const refreshToken = req?.cookies?.refreshToken || bodyRefreshToken;
    await this.authService.logout(userId, refreshToken);
    if (res) this.clearRefreshTokenCookie(res);
  }
}
