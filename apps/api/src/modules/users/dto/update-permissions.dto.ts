import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Permission strings' })
  permissions: string[];
}
