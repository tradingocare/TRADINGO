import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradeservInquiryService } from './tradeserv-inquiry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';

export class CreateInquiryDto {
  @ApiProperty() @IsString() clientName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientCompany?: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() requirement: string;
  @ApiPropertyOptional() @IsOptional() @IsString() budget?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timeline?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty() @IsEnum(InquiryStatus) status: InquiryStatus;
}

@ApiTags('TradeServ Inquiries')
@Controller('tradeserv')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class TradeservInquiryController {
  constructor(private readonly service: TradeservInquiryService) {}

  @Get('inquiries')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my inquiries' })
  async getInquiries(@CurrentUser('companyId') companyId: string) {
    return this.service.getInquiries(companyId);
  }

  @Get('inquiries/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get inquiry stats' })
  async getStats(@CurrentUser('companyId') companyId: string) {
    return this.service.getInquiryStats(companyId);
  }

  @Get('inquiries/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get inquiry detail' })
  async getInquiry(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.getInquiry(id, companyId);
  }

  @Post('inquiries')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an inquiry' })
  async createInquiry(@Body() dto: CreateInquiryDto, @CurrentUser('companyId') companyId: string) {
    return this.service.createInquiry(companyId, dto);
  }

  @Patch('inquiries/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update inquiry status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateInquiryStatusDto, @CurrentUser('companyId') companyId: string) {
    return this.service.updateInquiryStatus(id, companyId, dto.status);
  }
}
