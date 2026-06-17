import { ApiProperty } from '@nestjs/swagger';

export class AttributeFieldDto {
  @ApiProperty()
  fieldId: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  placeholder?: string;

  @ApiProperty({ required: false })
  helpText?: string;

  @ApiProperty({ required: false })
  unit?: string;

  @ApiProperty({ required: false })
  isRequired?: boolean;

  @ApiProperty({ required: false })
  options?: any;

  @ApiProperty({ required: false, description: 'Formatted display value based on field type' })
  displayValue: any;

  @ApiProperty({ required: false, description: 'Raw stored JSON value' })
  rawValue?: any;
}

export class AttributeSectionDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  sectionKey: string;

  @ApiProperty()
  sectionTitle: string;

  @ApiProperty({ required: false })
  sectionDescription?: string;

  @ApiProperty({ required: false })
  sectionIcon?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ type: [AttributeFieldDto] })
  fields: AttributeFieldDto[];
}

export class ProductAttributeDisplayDto {
  @ApiProperty({ required: false, description: 'Category template info' })
  template?: {
    id: string;
    name: string;
    version: number;
  };

  @ApiProperty({ type: [AttributeSectionDto] })
  sections: AttributeSectionDto[];

  @ApiProperty({ description: 'Flattened key-value map for quick lookup' })
  flattened: Record<string, any>;
}
