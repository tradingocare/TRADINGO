import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryDemandService } from './category-demand.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryDemandService],
  exports: [CategoriesService, CategoryDemandService],
})
export class CategoriesModule {}
