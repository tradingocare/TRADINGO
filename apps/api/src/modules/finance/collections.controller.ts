import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CollectionsService } from './collections.service';
import { CreateCollectionNoteDto, QueryCollectionsDto } from './dto';

@ApiTags('Collections')
@Throttle(RateLimits.WRITE_FINANCIAL)
@Controller('finance/collections')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get collections summary' })
  summary() { return this.collectionsService.getOutstandingSummary(); }

  @Get('aging')
  @ApiOperation({ summary: 'Get aging report' })
  aging() { return this.collectionsService.getAgingReport(); }

  @Get('overdue-companies')
  @ApiOperation({ summary: 'List overdue companies' })
  overdueCompanies(@Query() query: QueryCollectionsDto) { return this.collectionsService.listOverdueCompanies(query); }

  @Post(':companyId/notes')
  @ApiOperation({ summary: 'Create collection note' })
  createNote(@Param('companyId') companyId: string, @Body() dto: CreateCollectionNoteDto, @Req() req: any) { return this.collectionsService.createNote(companyId, dto, req.user.id); }

  @Get(':companyId/notes')
  @ApiOperation({ summary: 'List collection notes' })
  listNotes(@Param('companyId') companyId: string) { return this.collectionsService.listNotes(companyId); }

  @Get(':companyId/timeline')
  @ApiOperation({ summary: 'Get collection timeline' })
  timeline(@Param('companyId') companyId: string) { return this.collectionsService.getTimeline(companyId); }
}
