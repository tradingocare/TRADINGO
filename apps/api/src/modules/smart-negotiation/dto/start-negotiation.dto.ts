import { IsOptional, IsString } from 'class-validator';

export class StartNegotiationDto {
  @IsOptional() @IsString()      notes?: string;
}
