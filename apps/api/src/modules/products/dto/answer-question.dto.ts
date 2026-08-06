import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerQuestionDto {
  @IsString()
  @ApiProperty({ description: 'Answer text' })
  answer: string;
}
