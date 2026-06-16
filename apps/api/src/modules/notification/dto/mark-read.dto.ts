import { IsOptional, IsUUID } from 'class-validator';

export class MarkReadDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  ids?: string[];
}
