import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GOCASH_RedemptionType } from '@prisma/client';

export class RedeemDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @ApiProperty({ description: 'Redemption amount' })
  amount: number;

  @IsEnum(GOCASH_RedemptionType)
  @ApiProperty({ description: 'Redemption type', enum: GOCASH_RedemptionType })
  redemptionType: GOCASH_RedemptionType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reference' })
  reference?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class ReverseDto {
  @IsString()
  @ApiProperty({ description: 'Reason for reversal' })
  reason: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class RejectRedemptionDto {
  @IsString()
  @ApiProperty({ description: 'Rejection reason' })
  reason: string;
}
