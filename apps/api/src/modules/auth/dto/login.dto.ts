import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string;  // email | mobile | PAN

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  role?: string;  // buyer | vendor | admin

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
