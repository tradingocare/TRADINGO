import { IsString, IsBoolean, IsInt, IsOptional, IsArray, IsNumber, Min, Max, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { AiProviderStatus } from '@prisma/client'

export class CreateAiProviderDto {
  @IsString()
  name: string

  @IsString()
  displayName: string

  @IsString()
  providerType: string

  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @IsInt()
  @IsOptional()
  priority?: number

  @IsString()
  @IsOptional()
  baseUrl?: string

  @IsOptional()
  supportedModels?: any

  @IsArray()
  @IsOptional()
  supportedTasks?: string[]

  @IsInt()
  @IsOptional()
  timeoutMs?: number

  @IsInt()
  @IsOptional()
  retryCount?: number

  @IsInt()
  @IsOptional()
  retryDelayMs?: number

  @IsInt()
  @IsOptional()
  rateLimitRpm?: number

  @IsInt()
  @IsOptional()
  rateLimitTpm?: number

  @IsNumber()
  @IsOptional()
  costPer1kInput?: number

  @IsNumber()
  @IsOptional()
  costPer1kOutput?: number
}

export class UpdateAiProviderDto {
  @IsString()
  @IsOptional()
  displayName?: string

  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @IsInt()
  @IsOptional()
  priority?: number

  @IsString()
  @IsOptional()
  baseUrl?: string

  @IsOptional()
  supportedModels?: any

  @IsArray()
  @IsOptional()
  supportedTasks?: string[]

  @IsInt()
  @IsOptional()
  timeoutMs?: number

  @IsInt()
  @IsOptional()
  retryCount?: number

  @IsInt()
  @IsOptional()
  retryDelayMs?: number

  @IsInt()
  @IsOptional()
  rateLimitRpm?: number

  @IsInt()
  @IsOptional()
  rateLimitTpm?: number

  @IsNumber()
  @IsOptional()
  costPer1kInput?: number

  @IsNumber()
  @IsOptional()
  costPer1kOutput?: number

  @IsEnum(AiProviderStatus)
  @IsOptional()
  healthStatus?: AiProviderStatus
}

export class SetApiKeyDto {
  @IsString()
  providerName: string

  @IsString()
  apiKey: string
}

export class AiProviderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  @IsString()
  @IsOptional()
  search?: string

  @IsString()
  @IsOptional()
  status?: string
}
