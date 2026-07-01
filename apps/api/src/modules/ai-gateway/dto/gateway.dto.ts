import { IsString, IsOptional, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator'
import { TaskType } from '@prisma/client'

export class AiGatewayRequestDto {
  @IsEnum(TaskType)
  taskType: TaskType

  @IsObject()
  payload: Record<string, unknown>

  @IsString()
  @IsOptional()
  providerOverride?: string

  @IsString()
  @IsOptional()
  modelOverride?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTokens?: number

  @IsString()
  @IsOptional()
  idempotencyKey?: string

  @IsOptional()
  metadata?: Record<string, unknown>
}

export class AiGatewayResponseDto {
  success: boolean
  content: unknown
  provider: string
  model: string
  cached: boolean
  tokens?: { prompt: number; completion: number; total: number }
  latencyMs: number
  cost: number
}
