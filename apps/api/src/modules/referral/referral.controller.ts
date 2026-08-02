import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateReferralCodeDto, ApplyReferralDto, ValidateReferralDto,
  AddToBlacklistDto, SearchQueryDto,
} from './dto';

@ApiTags('Referral Engine')
@Controller('referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('codes')
  @ApiOperation({ summary: 'Create referral code' })
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async createReferralCode(@Body() dto: CreateReferralCodeDto, @CurrentUser('sub') userId: string) {
    return this.referralService.createReferralCode({ ...dto, userId });
  }

  @Get('codes/my')
  @ApiOperation({ summary: 'Get my referral code' })
  @Roles('BUYER', 'SELLER')
  async getMyReferralCode(@CurrentUser('sub') userId: string, @Query('type') type?: string) {
    return this.referralService.getMyReferralCode(userId, type as any);
  }

  @Get('codes/my/all')
  @ApiOperation({ summary: 'List my referral codes' })
  @Roles('BUYER', 'SELLER')
  async listMyReferralCodes(@CurrentUser('sub') userId: string) {
    return this.referralService.listMyReferralCodes(userId);
  }

  @Get('codes/:code')
  @ApiOperation({ summary: 'Get referral code' })
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async getReferralCode(@Param('code') code: string) {
    return this.referralService.getReferralCode(code);
  }

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'Validate referral code (public)' })
  @HttpCode(HttpStatus.OK)
  async validateReferral(@Body() dto: ValidateReferralDto) {
    return this.referralService.validateReferral(dto);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply referral' })
  @Roles('BUYER', 'SELLER')
  async applyReferral(@Body() dto: ApplyReferralDto) {
    return this.referralService.applyReferral(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get referral history' })
  @Roles('BUYER', 'SELLER')
  async getReferralHistory(@CurrentUser('sub') userId: string) {
    return this.referralService.getReferralHistory(userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get referral statistics' })
  @Roles('BUYER', 'SELLER')
  async getReferralStatistics(@CurrentUser('sub') userId: string) {
    return this.referralService.getReferralStatistics(userId);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get referral audit' })
  @Roles('ADMIN')
  async getReferralAudit(@Query('usageId') usageId?: string) {
    return this.referralService.getReferralAudit(usageId);
  }

  @Get('admin/dashboard')
  @ApiOperation({ summary: 'Get admin referral dashboard' })
  @Roles('ADMIN')
  async adminGetDashboard() {
    return this.referralService.adminGetDashboard();
  }

  @Get('admin/referrals')
  @ApiOperation({ summary: 'List all referrals' })
  @Roles('ADMIN')
  async adminListReferrals(@Query() query: SearchQueryDto) {
    return this.referralService.adminListReferrals(query);
  }

  @Get('admin/fraud-alerts')
  @ApiOperation({ summary: 'Get fraud alerts' })
  @Roles('ADMIN')
  async adminGetFraudAlerts() {
    return this.referralService.adminGetFraudAlerts();
  }

  @Get('admin/blacklist')
  @ApiOperation({ summary: 'Get blacklist' })
  @Roles('ADMIN')
  async adminGetBlacklist() {
    return this.referralService.adminGetBlacklist();
  }

  @Post('admin/blacklist')
  @ApiOperation({ summary: 'Add to blacklist' })
  @Roles('ADMIN')
  async adminAddToBlacklist(@Body() dto: AddToBlacklistDto, @CurrentUser('sub') userId: string) {
    return this.referralService.adminAddToBlacklist({ ...dto, createdBy: userId });
  }

  @Delete('admin/blacklist/:id')
  @ApiOperation({ summary: 'Remove from blacklist' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async adminRemoveFromBlacklist(@Param('id') id: string) {
    return this.referralService.adminRemoveFromBlacklist(id);
  }
}
