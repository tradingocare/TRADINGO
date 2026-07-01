import { IsString, IsOptional, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator'

export class AiCrmScoringDto {
  @IsObject()
  @IsOptional()
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  currentScore?: number
}

export class AiCrmNextBestActionDto {
  @IsObject()
  @IsOptional()
  leadData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentActivities?: Record<string, unknown>[]

  @IsString()
  @IsOptional()
  leadStatus?: string
}

export class AiCrmConversionProbabilityDto {
  @IsObject()
  @IsOptional()
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  pastInteractions?: Record<string, unknown>[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  trustScore?: number
}

export class AiCrmLeadInsightsDto {
  @IsObject()
  @IsOptional()
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  notes?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  timeline?: Record<string, unknown>[]
}

export class AiCrmSentimentDto {
  @IsArray()
  @IsOptional()
  notes?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  interactions?: Record<string, unknown>[]
}

export class AiCrmPipelineHealthDto {
  @IsArray()
  stages?: { name: string; count: number; value: number }[]

  @IsNumber()
  totalPipelineValue: number

  @IsNumber()
  activeLeads: number

  @IsNumber()
  conversionRate?: number
}

export class AiCrmForecastDto {
  @IsNumber()
  currentPipelineValue: number

  @IsNumber()
  activeDeals: number

  @IsNumber()
  @IsOptional()
  historicalConversionRate?: number

  @IsNumber()
  @IsOptional()
  avgDealSize?: number
}

export class AiCrmDealRiskDto {
  @IsObject()
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentActivities?: Record<string, unknown>[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  trustScore?: number
}

export class AiCrmRecommendedActionsDto {
  @IsObject()
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsString()
  leadStatus?: string
}

export class AiCrmCommunicationTipsDto {
  @IsString()
  leadName: string

  @IsString()
  @IsOptional()
  leadStatus?: string

  @IsString()
  @IsOptional()
  industry?: string

  @IsArray()
  @IsOptional()
  pastInteractions?: Record<string, unknown>[]
}

export class AiCrmFollowUpPriorityDto {
  @IsArray()
  followUps?: { id: string; title: string; dueDate: string; leadName?: string; leadValue?: number; leadStatus?: string }[]

  @IsNumber()
  @IsOptional()
  maxRecommendations?: number
}

export class AiCrmSidebarDto {
  @IsObject()
  @IsOptional()
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentNotes?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  upcomingFollowUps?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  pendingTasks?: Record<string, unknown>[]
}
