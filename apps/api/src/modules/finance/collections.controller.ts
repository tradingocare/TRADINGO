import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CollectionsService } from './collections.service';
import { CreateCollectionNoteDto, QueryCollectionsDto } from './dto';

@Controller('finance/collections')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('summary')
  summary() { return this.collectionsService.getOutstandingSummary(); }

  @Get('aging')
  aging() { return this.collectionsService.getAgingReport(); }

  @Get('overdue-companies')
  overdueCompanies(@Query() query: QueryCollectionsDto) { return this.collectionsService.listOverdueCompanies(query); }

  @Post(':companyId/notes')
  createNote(@Param('companyId') companyId: string, @Body() dto: CreateCollectionNoteDto, @Req() req: any) { return this.collectionsService.createNote(companyId, dto, req.user.id); }

  @Get(':companyId/notes')
  listNotes(@Param('companyId') companyId: string) { return this.collectionsService.listNotes(companyId); }

  @Get(':companyId/timeline')
  timeline(@Param('companyId') companyId: string) { return this.collectionsService.getTimeline(companyId); }
}
