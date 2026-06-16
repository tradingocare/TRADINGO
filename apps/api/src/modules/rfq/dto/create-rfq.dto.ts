import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min, IsArray, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { RfqType, RfqVisibility, RfqUrgency } from '@prisma/client';

export class CreateRfqLocationDto {
  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateRfqAttachmentDto {
  @ApiProperty({ enum: ['IMAGE', 'PDF', 'VIDEO', 'DOCUMENT'] })
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  fileSize?: number;
}

export class CreateRfqProductItemDto {
  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isService?: boolean;
}

export class CreateRfqDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RfqType })
  @IsEnum(RfqType)
  rfqType: RfqType;

  @ApiPropertyOptional({ enum: RfqVisibility })
  @IsOptional()
  @IsEnum(RfqVisibility)
  visibility?: RfqVisibility;

  @ApiPropertyOptional({ enum: RfqUrgency })
  @IsOptional()
  @IsEnum(RfqUrgency)
  urgency?: RfqUrgency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showBudget?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industryId?: string;

  @ApiPropertyOptional({ type: [CreateRfqLocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqLocationDto)
  locations?: CreateRfqLocationDto[];

  @ApiPropertyOptional({ type: [CreateRfqAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqAttachmentDto)
  attachments?: CreateRfqAttachmentDto[];

  @ApiPropertyOptional({ type: [CreateRfqProductItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqProductItemDto)
  productItems?: CreateRfqProductItemDto[];
}
