import { IsString, IsOptional, IsObject, IsNumber, IsArray, Min, Max, IsBoolean } from 'class-validator'

export class AiQuoteGenerateDto {
  @IsString()
  @IsOptional()
  rfqId?: string

  @IsString()
  @IsOptional()
  naturalLanguage?: string

  @IsObject()
  @IsOptional()
  rfqData?: Record<string, unknown>
}

export class AiQuotePriceRecommendationDto {
  @IsString()
  productName: string

  @IsNumber()
  @Min(0)
  basePrice: number

  @IsString()
  @IsOptional()
  currency?: string

  @IsNumber()
  @IsOptional()
  quantity?: number

  @IsString()
  @IsOptional()
  unit?: string

  @IsString()
  @IsOptional()
  deliveryTerms?: string

  @IsObject()
  @IsOptional()
  marketContext?: Record<string, unknown>
}

export class AiQuoteWinningProbabilityDto {
  @IsString()
  quoteId: string

  @IsString()
  @IsOptional()
  rfqId?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalAmount?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  leadTimeDays?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  trustScore?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  responseRate?: number

  @IsString()
  @IsOptional()
  deliveryTerms?: string

  @IsArray()
  @IsOptional()
  competitorQuotes?: { amount: number; leadTime: number; trustScore: number }[]
}

export class AiQuoteMarginAnalysisDto {
  @IsNumber()
  @Min(0)
  subtotal: number

  @IsNumber()
  @Min(0)
  totalAmount: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercent?: number

  @IsString()
  @IsOptional()
  currency?: string

  @IsNumber()
  @IsOptional()
  estimatedCostOfGoods?: number

  @IsNumber()
  @IsOptional()
  shippingCost?: number

  @IsNumber()
  @IsOptional()
  platformFee?: number

  @IsArray()
  @IsOptional()
  lineItems?: { productName: string; quantity: number; unitPrice: number; estimatedCost?: number }[]
}

export class AiQuoteCompetitivenessDto {
  @IsNumber()
  @Min(0)
  totalAmount: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  leadTimeDays?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  trustScore?: number

  @IsString()
  @IsOptional()
  deliveryTerms?: string

  @IsString()
  @IsOptional()
  paymentTerms?: string

  @IsString()
  @IsOptional()
  categoryName?: string

  @IsArray()
  @IsOptional()
  marketQuotes?: { amount: number; leadTime: number }[]
}

export class AiQuoteReviewDto {
  @IsString()
  quoteId: string

  @IsObject()
  @IsOptional()
  quoteData?: Record<string, unknown>

  @IsString()
  @IsOptional()
  language?: string

  @IsBoolean()
  @IsOptional()
  strictness?: boolean
}

export class AiQuoteNegotiationPrepDto {
  @IsString()
  @IsOptional()
  quoteId?: string

  @IsString()
  @IsOptional()
  buyerId?: string

  @IsObject()
  @IsOptional()
  quoteData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  buyerProfile?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  pastNegotiations?: Record<string, unknown>[]
}

export class AiQuoteRiskAssessmentDto {
  @IsString()
  @IsOptional()
  buyerId?: string

  @IsString()
  @IsOptional()
  buyerCompanyId?: string

  @IsObject()
  @IsOptional()
  buyerProfile?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  creditStatus?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  trustScore?: number

  @IsString()
  @IsOptional()
  verificationLevel?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  quoteAmount?: number
}

export class AiQuoteQualityScoreDto {
  @IsObject()
  quoteData: Record<string, unknown>

  @IsString()
  @IsOptional()
  language?: string
}

export class AiQuoteSidebarDto {
  @IsObject()
  @IsOptional()
  rfqData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  formData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  lineItems?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  companyProfile?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  buyerProfile?: Record<string, unknown>
}

export interface AiQuoteResponse<T> {
  success: boolean
  data: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}
