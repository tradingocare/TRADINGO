import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CompanyVerificationService } from './company-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@ApiTags('Company Verification')
@Controller('company-verifications')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class CompanyVerificationController {
  constructor(private readonly companyVerificationService: CompanyVerificationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit company verification' })
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitVerificationDto, @CurrentUser('sub') userId: string) {
    return this.companyVerificationService.submit(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List company verifications' })
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: { status?: string; cursor?: string; limit?: number }) {
    return this.companyVerificationService.findAll(query);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get verification by company' })
  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  async findByCompany(@Param('companyId') companyId: string) {
    return this.companyVerificationService.findByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company verification by ID' })
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.companyVerificationService.findById(id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review company verification' })
  @UseGuards(JwtAuthGuard)
  async review(@Param('id') id: string, @Body() dto: ReviewVerificationDto, @CurrentUser('sub') userId: string) {
    return this.companyVerificationService.review(id, dto, userId);
  }
}
