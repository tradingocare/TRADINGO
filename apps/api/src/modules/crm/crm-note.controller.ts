import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmNoteService } from './crm-note.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmNoteController {
  constructor(private readonly noteService: CrmNoteService) {}

  @Post(':leadId/notes')
  create(@Param('leadId') leadId: string, @Body() dto: CreateNoteDto, @Req() req: any) {
    return this.noteService.create(leadId, dto, req.user.id);
  }

  @Patch('notes/:id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.noteService.update(id, dto);
  }

  @Delete('notes/:id')
  delete(@Param('id') id: string) {
    return this.noteService.delete(id);
  }

  @Post('notes/:id/toggle-pin')
  togglePin(@Param('id') id: string) {
    return this.noteService.togglePin(id);
  }

  @Get(':leadId/notes')
  listByLead(@Param('leadId') leadId: string) {
    return this.noteService.listByLead(leadId);
  }
}
