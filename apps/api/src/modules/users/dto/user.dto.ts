import { IsOptional, IsString, IsEnum, IsArray, MinLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class UserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;
  @ApiProperty({ description: 'User email' })
  email: string;
  @ApiProperty({ description: 'User name' })
  name: string;
  @ApiProperty({ description: 'User role' })
  role: Role;
  @ApiProperty({ description: 'User permissions' })
  permissions: string[];
  @ApiProperty({ description: 'Whether user is active' })
  isActive: boolean;
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @ApiPropertyOptional({ description: 'User display name' })
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'User permissions' })
  permissions?: string[];
}

export class UserFilterDto {
  @IsOptional()
  @IsEnum(Role)
  @ApiPropertyOptional({ description: 'Filter by role' })
  role?: Role;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term' })
  search?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Filter users created after date' })
  createdAfter?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Pagination cursor' })
  cursor?: string;
}
