import { IsString, IsBoolean, IsInt, IsOptional, IsArray, IsNumber, Min, Max, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { AiProviderStatus } from '@prisma/client'

export class CreateAiProviderDto {
  @IsString()
  @ApiProperty({ description: 'Provider name' })
  name: string

  @IsString()
  @ApiProperty({ description: 'Display name' })
  displayName: string

  @IsString()
  @ApiProperty({ description: 'Provider type' })
  providerType: string

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Whether the provider is enabled' })
  enabled?: boolean

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Priority order' })
  priority?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Base URL' })
  baseUrl?: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Supported models' })
  supportedModels?: any

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Supported task types' })
  supportedTasks?: string[]

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Timeout in milliseconds' })
  timeoutMs?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Retry count' })
  retryCount?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Retry delay in milliseconds' })
  retryDelayMs?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Rate limit (requests per minute)' })
  rateLimitRpm?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Rate limit (tokens per minute)' })
  rateLimitTpm?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Cost per 1K input tokens' })
  costPer1kInput?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Cost per 1K output tokens' })
  costPer1kOutput?: number
}

export class UpdateAiProviderDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Whether the provider is enabled' })
  enabled?: boolean

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Priority order' })
  priority?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Base URL' })
  baseUrl?: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Supported models' })
  supportedModels?: any

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Supported task types' })
  supportedTasks?: string[]

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Timeout in milliseconds' })
  timeoutMs?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Retry count' })
  retryCount?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Retry delay in milliseconds' })
  retryDelayMs?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Rate limit (requests per minute)' })
  rateLimitRpm?: number

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Rate limit (tokens per minute)' })
  rateLimitTpm?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Cost per 1K input tokens' })
  costPer1kInput?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Cost per 1K output tokens' })
  costPer1kOutput?: number

  @IsEnum(AiProviderStatus)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Health status', enum: AiProviderStatus })
  healthStatus?: AiProviderStatus
}

export class SetApiKeyDto {
  @IsString()
  @ApiProperty({ description: 'Provider name' })
  providerName: string

  @IsString()
  @ApiProperty({ description: 'API key' })
  apiKey: string
}

export class AiProviderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Page limit (1-100)' })
  limit?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search term' })
  search?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Status filter' })
  status?: string
}
