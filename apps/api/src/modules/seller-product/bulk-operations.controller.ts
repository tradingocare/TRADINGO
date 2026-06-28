import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BulkOperationsService } from './bulk-operations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Seller Bulk Operations')
@UseGuards(JwtAuthGuard)
@Controller('seller/bulk')
export class BulkOperationsController {
  constructor(private readonly service: BulkOperationsService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview import data' })
  preview(@CurrentUser('sub') userId: string, @Body() dto: { rows: any[] }) {
    return this.service.previewImport(userId, dto.rows);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate import rows' })
  validate(@CurrentUser('sub') userId: string, @Body() dto: { rows: any[] }) {
    return this.service.validateRows(userId, dto.rows);
  }

  @Post('import')
  @ApiOperation({ summary: 'Execute import' })
  import(@CurrentUser('sub') userId: string, @Body() dto: { rows: any[] }) {
    return this.service.executeImport(userId, dto.rows);
  }

  @Post('upload-zip')
  @ApiOperation({ summary: 'Upload ZIP with images' })
  uploadZip(@CurrentUser('sub') userId: string, @Body() dto: { files: { fileName: string; url: string }[] }) {
    return this.service.uploadZip(userId, dto.files);
  }
}
