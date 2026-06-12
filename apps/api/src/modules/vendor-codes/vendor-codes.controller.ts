import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorCodesService } from './vendor-codes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Vendor Codes')
@Controller('vendor-codes')
export class VendorCodesController {
  constructor(private readonly vendorCodesService: VendorCodesService) {}

  @Post('assign-rm/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate and assign RM code to a user' })
  async assignRmCode(@Param('userId') userId: string) {
    const code = await this.vendorCodesService.generateRmCode(userId);
    return { rmCode: code };
  }

  @Post('assign-me/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate and assign ME code to a user' })
  async assignMeCode(@Param('userId') userId: string) {
    const code = await this.vendorCodesService.generateMeCode(userId);
    return { meCode: code };
  }

  @Post('generate-vendor/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate vendor code for a company (post-KYC)' })
  async generateVendorCode(@Param('companyId') companyId: string) {
    const code = await this.vendorCodesService.generateVendorCode(companyId);
    return { vendorCode: code };
  }

  @Get('lookup/:code')
  @ApiOperation({ summary: 'Look up code owner by code value' })
  async lookupCode(@Param('code') code: string) {
    const owner = await this.vendorCodesService.getCodeOwner(code);
    if (!owner) return { found: false };
    return { found: true, ...owner };
  }

  @Get('attribution/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attribution stats for a code' })
  async getAttribution(@Param('code') code: string) {
    const attribution = await this.vendorCodesService.getAttribution(code);
    if (!attribution) return { found: false };
    return { found: true, ...attribution };
  }

  @Post('referral/:companyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign referral code to a company during onboarding' })
  async assignReferral(
    @Param('companyId') companyId: string,
    @Body('referralCode') referralCode: string,
    @CurrentUser() user: any,
  ) {
    const owner = await this.vendorCodesService.assignReferral(companyId, referralCode);
    return { onboardedByCode: referralCode, referredBy: owner };
  }
}
