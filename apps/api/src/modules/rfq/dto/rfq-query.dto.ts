import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RfqStatus, RfqType } from '@prisma/client';

export class RfqQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(RfqStatus)
  status?: RfqStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(RfqType)
  rfqType?: RfqType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
