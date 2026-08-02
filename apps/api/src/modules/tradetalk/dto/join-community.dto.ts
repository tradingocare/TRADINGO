import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinCommunityDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
}
