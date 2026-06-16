import { Module } from '@nestjs/common';
import { CategoryTemplatesController, PublicTemplateController } from './category-templates.controller';
import { CategoryTemplatesService } from './category-templates.service';

@Module({
  controllers: [CategoryTemplatesController, PublicTemplateController],
  providers: [CategoryTemplatesService],
  exports: [CategoryTemplatesService],
})
export class CategoryTemplatesModule {}
