import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CompanyVerificationService } from './company-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@Controller('company-verifications')
export class CompanyVerificationController {
  constructor(private readonly companyVerificationService: CompanyVerificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(@Body() dto: SubmitVerificationDto, @CurrentUser('sub') userId: string) {
    return this.companyVerificationService.submit(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: { status?: string; cursor?: string; limit?: number }) {
    return this.companyVerificationService.findAll(query);
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  async findByCompany(@Param('companyId') companyId: string) {
    return this.companyVerificationService.findByCompany(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.companyVerificationService.findById(id);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  async review(@Param('id') id: string, @Body() dto: ReviewVerificationDto, @CurrentUser('sub') userId: string) {
    return this.companyVerificationService.review(id, dto, userId);
  }
}
