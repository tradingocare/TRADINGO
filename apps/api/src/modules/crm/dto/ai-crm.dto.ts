import { IsString, IsOptional, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiCrmScoringDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lead data for AI scoring' })
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data for AI scoring' })
  companyData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Current lead score' })
  currentScore?: number
}

export class AiCrmNextBestActionDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lead data' })
  leadData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent activities' })
  recentActivities?: Record<string, unknown>[]

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Current lead status' })
  leadStatus?: string
}

export class AiCrmConversionProbabilityDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lead data' })
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Past interaction history' })
  pastInteractions?: Record<string, unknown>[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Trust score' })
  trustScore?: number
}

export class AiCrmLeadInsightsDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lead data' })
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Timeline events' })
  timeline?: Record<string, unknown>[]
}

export class AiCrmSentimentDto {
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Notes for sentiment analysis' })
  notes?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Interactions for sentiment analysis' })
  interactions?: Record<string, unknown>[]
}

export class AiCrmPipelineHealthDto {
  @IsArray()
  @ApiProperty({ description: 'Pipeline stages with counts and values' })
  stages?: { name: string; count: number; value: number }[]

  @IsNumber()
  @ApiProperty({ description: 'Total pipeline value' })
  totalPipelineValue: number

  @IsNumber()
  @ApiProperty({ description: 'Number of active leads' })
  activeLeads: number

  @IsNumber()
  @ApiPropertyOptional({ description: 'Conversion rate' })
  conversionRate?: number
}

export class AiCrmForecastDto {
  @IsNumber()
  @ApiProperty({ description: 'Current pipeline value' })
  currentPipelineValue: number

  @IsNumber()
  @ApiProperty({ description: 'Number of active deals' })
  activeDeals: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Historical conversion rate' })
  historicalConversionRate?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Average deal size' })
  avgDealSize?: number
}

export class AiCrmDealRiskDto {
  @IsObject()
  @ApiProperty({ description: 'Lead data for risk assessment' })
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent activities' })
  recentActivities?: Record<string, unknown>[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Trust score' })
  trustScore?: number
}

export class AiCrmRecommendedActionsDto {
  @IsObject()
  @ApiProperty({ description: 'Lead data' })
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsString()
  @ApiProperty({ description: 'Current lead status' })
  leadStatus?: string
}

export class AiCrmCommunicationTipsDto {
  @IsString()
  @ApiProperty({ description: 'Lead name' })
  leadName: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lead status' })
  leadStatus?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry' })
  industry?: string

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Past interactions' })
  pastInteractions?: Record<string, unknown>[]
}

export class AiCrmFollowUpPriorityDto {
  @IsArray()
  @ApiProperty({ description: 'Follow-ups to prioritize' })
  followUps?: { id: string; title: string; dueDate: string; leadName?: string; leadValue?: number; leadStatus?: string }[]

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Maximum recommendations to return' })
  maxRecommendations?: number
}

export class AiCrmSidebarDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lead data' })
  leadData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent notes' })
  recentNotes?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Upcoming follow-ups' })
  upcomingFollowUps?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Pending tasks' })
  pendingTasks?: Record<string, unknown>[]
}
