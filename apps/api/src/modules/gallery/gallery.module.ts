import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, CompanyOwnerGuard],
  exports: [GalleryService],
})
export class GalleryModule {}
