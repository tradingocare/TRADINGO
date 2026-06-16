import { IsOptional, IsString } from 'class-validator';
import { CreateQuoteDto } from './create-quote.dto';

export class ReviseQuoteDto extends CreateQuoteDto {
  @IsOptional()
  @IsString()
  revisionComment?: string;
}
