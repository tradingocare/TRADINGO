import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CompanyVerificationService } from './company-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { StorageService } from '../storage/storage.service';

@ApiTags('Company Verification')
@Controller('company-verifications')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class CompanyVerificationController {
  constructor(
    private readonly companyVerificationService: CompanyVerificationService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit company verification' })
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitVerificationDto, @CurrentUser('sub') userId: string) {
    return this.companyVerificationService.submit(dto, userId);
  }

  // P0-1: the full verification list (every company's KYC submissions) is
  // admin/reviewer-only. Previously ANY authenticated user could call this and
  // harvest document URLs across all tenants.
  @Get()
  @ApiOperation({ summary: 'List company verifications (admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(@Query() query: { status?: string; cursor?: string; limit?: number }) {
    return this.companyVerificationService.findAll(query);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get verification by company' })
  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  async findByCompany(@Param('companyId') companyId: string) {
    return this.companyVerificationService.findByCompany(companyId);
  }

  // P0-1: cross-tenant read eliminated — a non-admin caller can only read a
  // verification that belongs to a company they own (404 otherwise, matching
  // the ownership-disclosure discipline of the canonical guard pattern).
  @Get(':id')
  @ApiOperation({ summary: 'Get company verification by ID' })
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: { sub: string; role: string }) {
    return this.companyVerificationService.findAuthorizedById(id, user.sub, user.role);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review company verification' })
  @UseGuards(JwtAuthGuard)
  async review(@Param('id') id: string, @Body() dto: ReviewVerificationDto, @CurrentUser('sub') userId: string) {
    return this.companyVerificationService.review(id, dto, userId);
  }

  /**
   * P0-1: authorized short-lived access to a sensitive KYC document.
   * ADMIN/SUPER_ADMIN verifiers or an owner of the verification's company get
   * a 5-minute presigned S3 GET URL; everyone else gets 403/404. The raw
   * object URL never appears in list/detail responses anymore.
   */
  @Get(':id/documents/:documentId/access')
  @ApiOperation({ summary: 'Get short-lived authorized access to a verification document' })
  @UseGuards(JwtAuthGuard)
  async getDocumentAccess(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: { sub: string; role: string },
  ): Promise<{ url: string; expiresIn: number }> {
    const { documentUrl } = await this.companyVerificationService.getDocumentForAuthorizedAccess(
      id,
      documentId,
      user.sub,
      user.role,
    );

    const key = this.storageService.extractKeyFromUrl(documentUrl);
    if (!key) {
      // Non-S3/external URL — cannot be presigned; authorized eyes only may
      // still receive it, but we never return it in bulk listings.
      return { url: documentUrl, expiresIn: 0 };
    }

    const expiresIn = 300; // 5 minutes — appropriate for sensitive KYC review
    const url = await this.storageService.generatePresignedUrl(key, expiresIn);
    return { url, expiresIn };
  }
}
