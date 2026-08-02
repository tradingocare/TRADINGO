import { IsString, IsOptional, IsObject, IsNumber, IsEnum, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { TaskType } from '@prisma/client'

export class AiStreamRequestDto {
  @IsEnum(TaskType)
  @ApiProperty({ description: 'Task type', enum: TaskType })
  taskType: TaskType

  @IsObject()
  @ApiProperty({ description: 'Request payload' })
  payload: Record<string, unknown>

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Provider override' })
  providerOverride?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Model override' })
  modelOverride?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Temperature (min 0)' })
  temperature?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Max tokens (min 1)' })
  maxTokens?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Idempotency key' })
  idempotencyKey?: string
}
