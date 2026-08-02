import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, IsUUID, Min, Max, IsDateString, IsObject, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalType, BookingStatus, ProposalStatus, ProfessionalCompanyStatus } from '@prisma/client';

export class RegisterProfessionalDto {
  @ApiProperty() @IsString() fullName: string;
  @ApiProperty() @IsString() professionalTitle: string;
  @ApiProperty() @IsEnum(ProfessionalType) professionalType: ProfessionalType;
  @ApiProperty() @IsString() companyName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mobile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() experience?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() banner?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ProfessionalType) professionalType?: ProfessionalType;
  @ApiPropertyOptional() @IsOptional() @IsString() videoIntroductionUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsObject() businessHours?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mobile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() panNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() businessType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() establishedYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() employeeCount?: number;
}

export class CreateProfessionalServiceDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priceMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priceMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() pricingType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProfessionalServiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priceMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priceMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() pricingType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sortOrder?: number;
}

export class CreatePortfolioItemDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() completionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() media?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class UpdatePortfolioItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() completionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() media?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() sortOrder?: number;
}

export class CreateCertificationDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() issuingAuthority: string;
  @ApiProperty() @IsDateString() issueDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certificateUrl?: string;
}

export class UpdateCertificationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuingAuthority?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certificateUrl?: string;
}

export class SetAvailabilityDto {
  @ApiProperty() @IsNumber() @Min(0) @Max(6) dayOfWeek: number;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAvailable?: boolean;
}

export class AddLanguageDto {
  @ApiProperty() @IsString() language: string;
  @ApiPropertyOptional() @IsOptional() @IsString() proficiency?: string;
}

export class AddServiceAreaDto {
  @ApiProperty() @IsString() city: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceType?: string;
}

export class CreateBookingDto {
  @ApiProperty() @IsUUID() companyId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() serviceId?: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() meetingLink?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty() @IsEnum(BookingStatus) status: BookingStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() meetingLink?: string;
}

export class CreateProposalDto {
  @ApiProperty() @IsUUID() clientId: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() inquiryId?: string;
}

export class UpdateProposalStatusDto {
  @ApiProperty() @IsEnum(ProposalStatus) status: ProposalStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectionReason?: string;
}

export class CreateReviewDto {
  @ApiProperty() @IsUUID() bookingId: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rehired?: boolean;
}

export class CreateBookingPaymentOrderDto {
  @ApiProperty({ description: 'Amount in paise (e.g. 50000 = ₹500)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}

export class VerifyBookingPaymentDto {
  @ApiProperty() @IsString() razorpayPaymentId: string;
  @ApiProperty() @IsString() razorpayOrderId: string;
  @ApiProperty() @IsString() razorpaySignature: string;
}

export class SearchProfessionalsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ProfessionalType) professionalType?: ProfessionalType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minRating?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(50) limit?: number = 20;
}

export class ProfessionalSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional() logo?: string;
  @ApiPropertyOptional() professionalType?: ProfessionalType;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() trustScore: number;
  @ApiPropertyOptional() verificationLevel?: string;
  @ApiPropertyOptional() responseTimeMinutes?: number;
  @ApiPropertyOptional() lastActiveAt?: Date;
  @ApiPropertyOptional() videoIntroductionUrl?: string;
  @ApiPropertyOptional() socialLinks?: Record<string, string>;
  @ApiPropertyOptional() serviceCount?: number;
  @ApiPropertyOptional() portfolioCount?: number;
  @ApiPropertyOptional() reviewCount?: number;
  @ApiPropertyOptional() averageRating?: number;
  @ApiPropertyOptional() locations?: string[];
  @ApiPropertyOptional() languages?: string[];
}

export class AiProfileReviewDto {
  @ApiProperty() @IsString() action: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() context?: Record<string, unknown>;
}

export class AdminApproveProfessionalDto {
  @ApiProperty() @IsEnum(ProfessionalCompanyStatus) status: 'APPROVED' | 'REJECTED';
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

// ── AI TradeServ DTOs ────────────────────────────────────
export class AiTradeservProfileReviewDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() experience?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}

export class AiTradeservBioDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() experience?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) keywords?: string[];
}

export class AiTradeservSeoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class AiTradeservPortfolioSuggestionsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() portfolioItemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class AiTradeservServiceDescriptionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() requirements?: string;
}

export class AiTradeservProposalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() requirements?: string;
}

export class AiTradeservPricingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() serviceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) deliveryDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) priceMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) priceMax?: number;
}

export class AiTradeservSkillsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) currentSkills?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
}

export class AiTradeservCategoriesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() serviceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currentCategory?: string;
}

export class AiTradeservLeadReplyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serviceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) budget?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() requirements?: string;
}

export class AiTradeservMarketInsightsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() serviceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currentCategory?: string;
}

export class AiTradeservCompetitorAnalysisDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() experience?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}

export class AiTradeservRecommendationsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) limit?: number;
}

export class SaveSearchDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;

  @ApiProperty() @IsObject() searchCriteria: Record<string, unknown>;
}
