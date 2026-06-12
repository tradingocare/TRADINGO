import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImageOrder {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsInt()
  sortOrder: number;
}

export class ReorderGalleryDto {
  @ApiProperty({ type: [ImageOrder] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrder)
  images: ImageOrder[];
}
