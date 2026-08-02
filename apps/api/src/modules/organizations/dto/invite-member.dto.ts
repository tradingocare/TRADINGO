import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgMemberRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  @ApiProperty({ description: 'Member email address' })
  email: string;

  @IsOptional()
  @IsEnum(OrgMemberRole)
  @ApiPropertyOptional({ description: 'Member role', enum: OrgMemberRole })
  role?: OrgMemberRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(OrgMemberRole)
  @ApiProperty({ description: 'Member role', enum: OrgMemberRole })
  role: OrgMemberRole;
}
