import { IsString, IsOptional, IsEmail, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublicLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({ description: 'Full name' })
  name: string;

  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ description: 'Email address' })
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty({ description: 'Subject' })
  subject: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  @ApiProperty({ description: 'Message' })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ description: 'Turnstile verification token' })
  turnstileToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ description: 'Honeypot field (must be empty)', required: false })
  website?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Lead source override' })
  source?: string;
}
