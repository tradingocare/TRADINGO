import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrgMemberRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(OrgMemberRole)
  role?: OrgMemberRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(OrgMemberRole)
  role: OrgMemberRole;
}
