import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class StartNegotiationDto {
  @IsOptional() @IsString()      notes?: string;
}
