import { IsArray, ValidateNested, IsString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class AttributeEntry {
  @IsString()
  fieldKey: string;

  @IsObject()
  value: any;
}

export class SaveAttributesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeEntry)
  attributes: AttributeEntry[];
}
