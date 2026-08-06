import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityMemberRole } from '@prisma/client';

export class InviteMemberDto {
  @IsString()
  @ApiProperty({ description: 'Member email' })
  email: string;
  @IsOptional()
  @IsEnum(CommunityMemberRole)
  @ApiPropertyOptional({ description: 'Member role', enum: CommunityMemberRole })
  role?: CommunityMemberRole;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Invitation message' })
  message?: string;
}
