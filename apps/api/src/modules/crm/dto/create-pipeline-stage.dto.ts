import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePipelineStageDto {
  @IsString()
  @ApiProperty({ description: 'Stage name' })
  name: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Stage order' })
  order?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Stage color' })
  color?: string;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is default stage' })
  isDefault?: boolean;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is won stage' })
  isWon?: boolean;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is lost stage' })
  isLost?: boolean;
}

export class UpdatePipelineStageDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Stage name' })
  name?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Stage order' })
  order?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Stage color' })
  color?: string;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is default stage' })
  isDefault?: boolean;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is won stage' })
  isWon?: boolean;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is lost stage' })
  isLost?: boolean;
}
