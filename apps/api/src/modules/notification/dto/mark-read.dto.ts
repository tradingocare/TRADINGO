import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkReadDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({ description: 'Notification IDs to mark as read' })
  ids?: string[];
}
