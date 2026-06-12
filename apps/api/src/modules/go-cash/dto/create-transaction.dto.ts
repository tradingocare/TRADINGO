import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { GoCashTransactionType, GoCashRedemptionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ enum: GoCashTransactionType })
  @IsEnum(GoCashTransactionType)
  type: GoCashTransactionType;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceModule?: string;

  @ApiPropertyOptional({ enum: GoCashRedemptionType })
  @IsOptional()
  @IsEnum(GoCashRedemptionType)
  redemptionType?: GoCashRedemptionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;
}
