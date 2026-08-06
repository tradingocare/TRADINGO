import { IsString, IsOptional, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TaskType } from '@prisma/client'

export class AiGatewayRequestDto {
  @IsEnum(TaskType)
  @ApiProperty({ description: 'Task type', enum: TaskType })
  taskType: TaskType

  @IsObject()
  @ApiProperty({ description: 'Request payload' })
  payload: Record<string, unknown>

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Provider override' })
  providerOverride?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Model override' })
  modelOverride?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  @ApiPropertyOptional({ description: 'Temperature (0-2)' })
  temperature?: number

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Max tokens' })
  maxTokens?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Idempotency key' })
  idempotencyKey?: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>
}

export class AiGatewayResponseDto {
  @ApiProperty({ description: 'Whether the request succeeded' })
  success: boolean
  @ApiProperty({ description: 'Response content' })
  content: unknown
  @ApiProperty({ description: 'Provider used' })
  provider: string
  @ApiProperty({ description: 'Model used' })
  model: string
  @ApiProperty({ description: 'Whether result was cached' })
  cached: boolean
  @ApiPropertyOptional({ description: 'Token usage' })
  tokens?: { prompt: number; completion: number; total: number }
  @ApiProperty({ description: 'Latency in milliseconds' })
  latencyMs: number
  @ApiProperty({ description: 'Cost' })
  cost: number
}
