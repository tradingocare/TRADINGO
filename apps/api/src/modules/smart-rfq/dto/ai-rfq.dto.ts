import { IsString, IsOptional, IsArray, IsNumber, IsObject, Min, Max, IsEnum } from 'class-validator'

export class NaturalLanguageRfqDto {
  @IsString()
  text: string

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @IsString()
  companyId?: string
}

export class RefineRfqDto {
  @IsString()
  rfqId: string

  @IsOptional()
  @IsString()
  focusArea?: string

  @IsOptional()
  @IsString()
  additionalContext?: string
}

export class DetectMissingDto {
  @IsObject()
  rfqData: Record<string, unknown>

  @IsOptional()
  @IsString()
  language?: string
}

export class DetectDuplicatesDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productNames?: string[]
}

export class PredictCategoryDto {
  @IsString()
  productName: string

  @IsOptional()
  @IsString()
  description?: string
}

export class SuggestProductsDto {
  @IsArray()
  @IsString({ each: true })
  productNames: string[]

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsNumber()
  limit?: number
}

export class SuggestSuppliersDto {
  @IsString()
  rfqId: string

  @IsOptional()
  @IsNumber()
  limit?: number
}

export class QualityScoreDto {
  @IsObject()
  rfqData: Record<string, unknown>
}

export class TranslateRfqDto {
  @IsString()
  rfqId: string

  @IsString()
  targetLanguage: string
}

export class AiAssistantDto {
  @IsObject()
  rfqData: Record<string, unknown>

  @IsOptional()
  @IsString()
  context?: string
}

export class AiRfqResponse<T = unknown> {
  success: boolean
  data: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

export class GeneratedRfq {
  title: string
  description: string
  category: string
  quantity: number
  unit: string
  deliveryLocation: string
  deliveryTimeline: string
  budgetMin: number
  budgetMax: number
  specifications: string[]
  suggestedTags: string[]
}

export class MissingField {
  field: string
  label: string
  reason: string
  suggestion: string
}

export class DuplicateRfq {
  rfqId: string
  title: string
  similarityScore: number
  status: string
  createdAt: string
}

export class QualityScoreResult {
  score: number
  maxScore: number
  breakdown: Array<{ category: string; score: number; maxScore: number; weight: number }>
  improvements: string[]
  strengths: string[]
}
