import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ description: 'User email address' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  @ApiProperty({ description: 'User password' })
  password: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({ description: 'User display name' })
  name: string;
}
