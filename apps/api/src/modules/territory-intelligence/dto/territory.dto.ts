import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTerritoryDto {
  @IsString()
  @ApiProperty({ description: 'Territory name' })
  name: string;

  @IsString()
  @ApiProperty({ description: 'Territory type' })
  type: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Parent territory ID' })
  parentId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'States covered' })
  states?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Cities covered' })
  cities?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Relationship manager ID' })
  rmId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Coverage details' })
  coverage?: string;
}

export class UpdateTerritoryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Territory name' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Territory type' })
  type?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Parent territory ID' })
  parentId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'States covered' })
  states?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Cities covered' })
  cities?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Relationship manager ID' })
  rmId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether territory is active' })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Coverage details' })
  coverage?: string;
}
