import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { AiBulkService } from './ai-bulk.service';
import { BulkEnhancementDto } from './dto/ai.dto';

@ApiTags('AI Bulk Processing')
@Controller('ai/bulk')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AiBulkController {
  constructor(private readonly bulkService: AiBulkService) {}

  @ApiOperation({ summary: 'Submit bulk enhancement job' })
  @Post('enhance')
  bulkEnhance(@Body() dto: BulkEnhancementDto, @Req() req: any) {
    return this.bulkService.createBulkJob(dto, req.user.companyId || req.user.id, req.user.id);
  }

  @ApiOperation({ summary: 'List bulk processing jobs' })
  @Get('jobs')
  listJobs(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.bulkService.listJobs(req.user.companyId || req.user.id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @ApiOperation({ summary: 'Get bulk job statistics' })
  @Get('stats')
  stats(@Req() req: any) {
    return this.bulkService.getJobStats(req.user.companyId);
  }
}
