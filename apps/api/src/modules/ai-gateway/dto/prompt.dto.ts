import { IsString, IsInt, IsOptional, IsNumber, IsBoolean, Min, Max, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { TaskType } from '@prisma/client'

export class CreateAiPromptDto {
  @IsEnum(TaskType)
  @ApiProperty({ description: 'Task type', enum: TaskType })
  taskType: TaskType

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Prompt version' })
  version?: number

  @IsString()
  @ApiProperty({ description: 'Prompt name' })
  name: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Prompt description' })
  description?: string

  @IsString()
  @ApiProperty({ description: 'System prompt content' })
  systemPrompt: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'User prompt content' })
  userPrompt?: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Template variables' })
  variables?: any

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  @ApiPropertyOptional({ description: 'Temperature (0-2)' })
  temperature?: number

  @IsInt()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum tokens' })
  maxTokens?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Provider override' })
  providerOverride?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Model override' })
  modelOverride?: string

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Whether the prompt is active' })
  isActive?: boolean
}

export class UpdateAiPromptDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Prompt name' })
  name?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Prompt description' })
  description?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'System prompt content' })
  systemPrompt?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'User prompt content' })
  userPrompt?: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Template variables' })
  variables?: any

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  @ApiPropertyOptional({ description: 'Temperature (0-2)' })
  temperature?: number

  @IsInt()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum tokens' })
  maxTokens?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Provider override' })
  providerOverride?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Model override' })
  modelOverride?: string

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Whether the prompt is active' })
  isActive?: boolean
}

export class AiPromptQueryDto {
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
  @ApiPropertyOptional({ description: 'Task type filter' })
  taskType?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search term' })
  search?: string
}
