import { Module } from '@nestjs/common';
import { CatalogAdapterService } from './catalog-adapter.service';

@Module({
  providers: [CatalogAdapterService],
  exports: [CatalogAdapterService],
})
export class CatalogAdapterModule {}
