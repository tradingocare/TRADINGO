import { IsString, IsOptional, IsObject, IsNumber, IsArray, Min, Max, IsBoolean, IsEnum } from 'class-validator'

export class AiNegotiationStrategyDto {
  @IsObject()
  @IsOptional()
  negotiationData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  quoteData?: Record<string, unknown>

  @IsString()
  @IsOptional()
  role?: 'BUYER' | 'SELLER'
}

export class AiNegotiationBuyerBehaviorDto {
  @IsString()
  @IsOptional()
  buyerCompanyId?: string

  @IsArray()
  @IsOptional()
  pastNegotiations?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  chatMessages?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  buyerProfile?: Record<string, unknown>
}

export class AiNegotiationSellerSuggestionsDto {
  @IsObject()
  @IsOptional()
  negotiationData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  currentOffer?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyProfile?: Record<string, unknown>
}

export class AiNegotiationSentimentDto {
  @IsArray()
  @IsOptional()
  chatMessages?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  negotiationEvents?: Record<string, unknown>[]
}

export class AiNegotiationProbabilityDto {
  @IsObject()
  @IsOptional()
  negotiationData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  sellerTrustScore?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  buyerTrustScore?: number

  @IsNumber()
  @IsOptional()
  totalRounds?: number

  @IsString()
  @IsOptional()
  negotiationStatus?: string
}

export class AiNegotiationRepliesDto {
  @IsString()
  @IsOptional()
  role?: 'BUYER' | 'SELLER'

  @IsString()
  tone?: 'PROFESSIONAL' | 'SHORT' | 'COMMERCIAL' | 'ESCALATION'

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentMessages?: Record<string, unknown>[]
}

export class AiNegotiationRiskDto {
  @IsObject()
  @IsOptional()
  negotiationData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  buyerCreditStatus?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  buyerTrustScore?: number

  @IsString()
  @IsOptional()
  buyerVerificationLevel?: string

  @IsNumber()
  @IsOptional()
  quoteAmount?: number
}

export class AiNegotiationSummaryDto {
  @IsArray()
  @IsOptional()
  chatMessages?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  negotiationEvents?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  versions?: Record<string, unknown>[]
}

export class AiNegotiationTranslateDto {
  @IsString()
  text: string

  @IsString()
  targetLanguage: string

  @IsString()
  @IsOptional()
  sourceLanguage?: string
}

export class AiNegotiationMemoryDto {
  @IsString()
  @IsOptional()
  rfqId?: string

  @IsString()
  @IsOptional()
  quoteId?: string

  @IsString()
  @IsOptional()
  negotiationId?: string

  @IsString()
  @IsOptional()
  buyerCompanyId?: string

  @IsString()
  @IsOptional()
  sellerCompanyId?: string
}

export class AiNegotiationTimelineDto {
  @IsArray()
  @IsOptional()
  versions?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  events?: Record<string, unknown>[]
}

export class AiNegotiationSidebarDto {
  @IsObject()
  @IsOptional()
  negotiationData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  quoteData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  buyerProfile?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  sellerProfile?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentMessages?: Record<string, unknown>[]
}
