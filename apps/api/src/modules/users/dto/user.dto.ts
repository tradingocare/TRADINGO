import { IsOptional, IsString, IsEnum, IsArray, MinLength, IsDateString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UserFilterDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsString()
  cursor?: string;
}
