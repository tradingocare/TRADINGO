import { IsString, IsInt, IsOptional, IsNumber, IsBoolean, Min, Max, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { TaskType } from '@prisma/client'

export class CreateAiPromptDto {
  @IsEnum(TaskType)
  taskType: TaskType

  @IsInt()
  @IsOptional()
  version?: number

  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  systemPrompt: string

  @IsString()
  @IsOptional()
  userPrompt?: string

  @IsOptional()
  variables?: any

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number

  @IsInt()
  @IsOptional()
  @Min(1)
  maxTokens?: number

  @IsString()
  @IsOptional()
  providerOverride?: string

  @IsString()
  @IsOptional()
  modelOverride?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

export class UpdateAiPromptDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  systemPrompt?: string

  @IsString()
  @IsOptional()
  userPrompt?: string

  @IsOptional()
  variables?: any

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number

  @IsInt()
  @IsOptional()
  @Min(1)
  maxTokens?: number

  @IsString()
  @IsOptional()
  providerOverride?: string

  @IsString()
  @IsOptional()
  modelOverride?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

export class AiPromptQueryDto {
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
  taskType?: string

  @IsString()
  @IsOptional()
  search?: string
}
