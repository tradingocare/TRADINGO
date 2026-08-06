import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunityMemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(CommunityMemberRole)
  @ApiProperty({ description: 'New member role', enum: CommunityMemberRole })
  role: CommunityMemberRole;
}
