import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmNoteService } from './crm-note.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';

@ApiTags('CRM Note')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmNoteController {
  constructor(private readonly noteService: CrmNoteService) {}

  @Post(':leadId/notes')
  @ApiOperation({ summary: 'Create note' })
  create(@Param('leadId') leadId: string, @Body() dto: CreateNoteDto, @Req() req: any) {
    return this.noteService.create(leadId, dto, req.user.id);
  }

  @Patch('notes/:id')
  @ApiOperation({ summary: 'Update note' })
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.noteService.update(id, dto);
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Delete note' })
  delete(@Param('id') id: string) {
    return this.noteService.delete(id);
  }

  @Post('notes/:id/toggle-pin')
  @ApiOperation({ summary: 'Toggle note pin' })
  togglePin(@Param('id') id: string) {
    return this.noteService.togglePin(id);
  }

  @Get(':leadId/notes')
  @ApiOperation({ summary: 'List lead notes' })
  listByLead(@Param('leadId') leadId: string) {
    return this.noteService.listByLead(leadId);
  }
}
