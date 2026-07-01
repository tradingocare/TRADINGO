import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiBulkService } from './ai-bulk.service';
import { BulkEnhancementDto } from './dto/ai.dto';

@Controller('ai/bulk')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiBulkController {
  constructor(private readonly bulkService: AiBulkService) {}

  @Post('enhance')
  bulkEnhance(@Body() dto: BulkEnhancementDto, @Req() req: any) {
    return this.bulkService.createBulkJob(dto, req.user.companyId || req.user.id, req.user.id);
  }

  @Get('jobs')
  listJobs(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.bulkService.listJobs(req.user.companyId || req.user.id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @Get('stats')
  stats(@Req() req: any) {
    return this.bulkService.getJobStats(req.user.companyId);
  }
}
