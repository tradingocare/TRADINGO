import { IsOptional, IsEnum, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { TaskType } from '@prisma/client'

export class AiUsageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page limit' })
  limit?: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string

  @IsEnum(TaskType)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Task type filter', enum: TaskType })
  taskType?: TaskType

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Provider name' })
  providerName?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'From date' })
  fromDate?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'To date' })
  toDate?: string
}
