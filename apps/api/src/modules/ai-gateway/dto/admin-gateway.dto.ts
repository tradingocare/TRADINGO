import { IsOptional, IsEnum, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { TaskType } from '@prisma/client'

export class AiUsageQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number

  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsString()
  @IsOptional()
  companyId?: string

  @IsEnum(TaskType)
  @IsOptional()
  taskType?: TaskType

  @IsString()
  @IsOptional()
  providerName?: string

  @IsString()
  @IsOptional()
  fromDate?: string

  @IsString()
  @IsOptional()
  toDate?: string
}
