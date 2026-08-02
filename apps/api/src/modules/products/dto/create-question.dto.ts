import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @IsString()
  @ApiProperty({ description: 'Question text' })
  question: string;
}
