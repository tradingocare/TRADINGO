import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ description: 'User email address' })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'User password (min 8 chars)' })
  password: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({ description: 'User display name' })
  name: string;

  @IsOptional()
  @IsEnum(Role)
  @ApiPropertyOptional({ description: 'User role' })
  role?: Role;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'User permissions' })
  permissions?: string[];
}
