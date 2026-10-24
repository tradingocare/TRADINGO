import { Module } from '@nestjs/common';
import { CategoryMappingService } from './category-mapping.service';
import { CategoryMappingController } from './category-mapping.controller';

@Module({
  controllers: [CategoryMappingController],
  providers: [CategoryMappingService],
  exports: [CategoryMappingService],
})
export class CategoryMappingModule {}
