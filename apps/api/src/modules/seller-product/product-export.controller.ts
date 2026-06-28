import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductExportService } from './product-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Seller Export')
@UseGuards(JwtAuthGuard)
@Controller('seller/export')
export class ProductExportController {
  constructor(private readonly service: ProductExportService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start export' })
  startExport(@CurrentUser('sub') userId: string, @Body() dto: { type: 'EXCEL' | 'CSV' }) {
    return this.service.startExport(userId, dto.type || 'CSV');
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List export jobs' })
  listJobs(@CurrentUser('sub') userId: string) {
    return this.service.listJobs(userId);
  }

  @Get('jobs/:id/download')
  @ApiOperation({ summary: 'Download export' })
  downloadJob(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.downloadJob(userId, id);
  }
}
