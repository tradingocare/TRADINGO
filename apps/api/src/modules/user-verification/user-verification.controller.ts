import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserVerificationService } from './user-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitUserVerificationDto } from './dto/submit-user-verification.dto';
import { ReviewUserVerificationDto } from './dto/review-user-verification.dto';
import { StorageService } from '../storage/storage.service';

@ApiTags('User Verification')
@Controller('user-verifications')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class UserVerificationController {
  constructor(
    private readonly userVerificationService: UserVerificationService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a user verification request' })
  async submit(@Body() dto: SubmitUserVerificationDto, @CurrentUser('sub') userId: string) {
    return this.userVerificationService.submit(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all user verification requests' })
  async findAll(@Query() query: { status?: string; cursor?: string; limit?: number }) {
    return this.userVerificationService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my verification requests' })
  async findMy(@CurrentUser('sub') userId: string) {
    return this.userVerificationService.findByUser(userId);
  }

  // P0-1: cross-tenant read eliminated — non-admin callers can only read their
  // own verification (404 otherwise, no existence disclosure).
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single user verification' })
  async findOne(@Param('id') id: string, @CurrentUser() user: { sub: string; role: string }) {
    return this.userVerificationService.findAuthorizedById(id, user.sub, user.role);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Review (approve/reject) a user verification' })
  async review(@Param('id') id: string, @Body() dto: ReviewUserVerificationDto, @CurrentUser('sub') userId: string) {
    return this.userVerificationService.review(id, dto, userId);
  }

  /**
   * P0-1: authorized short-lived access to a sensitive user-verification
   * document. ADMIN/SUPER_ADMIN or the verification's own user get a
   * 5-minute presigned S3 GET URL; everyone else 403/404.
   */
  @Get(':id/documents/:documentId/access')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get short-lived authorized access to a user verification document' })
  async getDocumentAccess(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: { sub: string; role: string },
  ): Promise<{ url: string; expiresIn: number }> {
    const { documentUrl } = await this.userVerificationService.getDocumentForAuthorizedAccess(
      id,
      documentId,
      user.sub,
      user.role,
    );

    const key = this.storageService.extractKeyFromUrl(documentUrl);
    if (!key) {
      return { url: documentUrl, expiresIn: 0 };
    }

    const expiresIn = 300; // 5 minutes — sensitive document review
    const url = await this.storageService.generatePresignedUrl(key, expiresIn);
    return { url, expiresIn };
  }
}
