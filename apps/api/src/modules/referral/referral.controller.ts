import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateReferralCodeDto, ApplyReferralDto, ValidateReferralDto,
  AddToBlacklistDto, SearchQueryDto,
} from './dto';

@Controller('referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('codes')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async createReferralCode(@Body() dto: CreateReferralCodeDto, @CurrentUser('sub') userId: string) {
    return this.referralService.createReferralCode({ ...dto, userId });
  }

  @Get('codes/my')
  @Roles('BUYER', 'SELLER')
  async getMyReferralCode(@CurrentUser('sub') userId: string, @Query('type') type?: string) {
    return this.referralService.getMyReferralCode(userId, type as any);
  }

  @Get('codes/my/all')
  @Roles('BUYER', 'SELLER')
  async listMyReferralCodes(@CurrentUser('sub') userId: string) {
    return this.referralService.listMyReferralCodes(userId);
  }

  @Get('codes/:code')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async getReferralCode(@Param('code') code: string) {
    return this.referralService.getReferralCode(code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateReferral(@Body() dto: ValidateReferralDto) {
    return this.referralService.validateReferral(dto);
  }

  @Post('apply')
  @Roles('ADMIN')
  async applyReferral(@Body() dto: ApplyReferralDto) {
    return this.referralService.applyReferral(dto);
  }

  @Get('history')
  @Roles('BUYER', 'SELLER')
  async getReferralHistory(@CurrentUser('sub') userId: string) {
    return this.referralService.getReferralHistory(userId);
  }

  @Get('statistics')
  @Roles('BUYER', 'SELLER')
  async getReferralStatistics(@CurrentUser('sub') userId: string) {
    return this.referralService.getReferralStatistics(userId);
  }

  @Get('audit')
  @Roles('ADMIN')
  async getReferralAudit(@Query('usageId') usageId?: string) {
    return this.referralService.getReferralAudit(usageId);
  }

  @Get('admin/dashboard')
  @Roles('ADMIN')
  async adminGetDashboard() {
    return this.referralService.adminGetDashboard();
  }

  @Get('admin/referrals')
  @Roles('ADMIN')
  async adminListReferrals(@Query() query: SearchQueryDto) {
    return this.referralService.adminListReferrals(query);
  }

  @Get('admin/fraud-alerts')
  @Roles('ADMIN')
  async adminGetFraudAlerts() {
    return this.referralService.adminGetFraudAlerts();
  }

  @Get('admin/blacklist')
  @Roles('ADMIN')
  async adminGetBlacklist() {
    return this.referralService.adminGetBlacklist();
  }

  @Post('admin/blacklist')
  @Roles('ADMIN')
  async adminAddToBlacklist(@Body() dto: AddToBlacklistDto, @CurrentUser('sub') userId: string) {
    return this.referralService.adminAddToBlacklist({ ...dto, createdBy: userId });
  }

  @Delete('admin/blacklist/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async adminRemoveFromBlacklist(@Param('id') id: string) {
    return this.referralService.adminRemoveFromBlacklist(id);
  }
}
