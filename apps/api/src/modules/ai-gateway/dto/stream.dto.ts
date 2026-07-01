import { IsString, IsOptional, IsObject, IsNumber, IsEnum, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { TaskType } from '@prisma/client'

export class AiStreamRequestDto {
  @IsEnum(TaskType)
  taskType: TaskType

  @IsObject()
  payload: Record<string, unknown>

  @IsOptional()
  @IsString()
  providerOverride?: string

  @IsOptional()
  @IsString()
  modelOverride?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  temperature?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxTokens?: number

  @IsOptional()
  @IsString()
  idempotencyKey?: string
}
