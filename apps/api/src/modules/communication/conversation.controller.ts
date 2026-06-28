import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Communication Hub — Conversations')
@UseGuards(JwtAuthGuard)
@Controller('communication/conversations')
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  create(@CurrentUser('sub') userId: string, @Body() body: any) {
    return this.service.create({ ...body, createdBy: userId });
  }

  @Get()
  @ApiOperation({ summary: 'List my conversations' })
  findMy(@CurrentUser('sub') userId: string, @Query('source') source?: string, @Query('archived') archived?: string) {
    return this.service.findByUser(userId, { source, archived: archived === 'true' ? true : archived === 'false' ? false : undefined });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation detail' })
  findById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.findById(id, userId);
  }

  @Patch(':id/archive')
  @HttpCode(204)
  @ApiOperation({ summary: 'Archive conversation' })
  archive(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.archive(userId, id);
  }

  @Patch(':id/mute')
  @HttpCode(204)
  @ApiOperation({ summary: 'Toggle mute' })
  mute(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('muted') muted: boolean) {
    return this.service.mute(userId, id, muted);
  }

  @Patch(':id/pin')
  @HttpCode(204)
  @ApiOperation({ summary: 'Toggle pin' })
  pin(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('pinned') pinned: boolean) {
    return this.service.pin(userId, id, pinned);
  }

  @Patch(':id/notes')
  @ApiOperation({ summary: 'Update personal notes on conversation' })
  updateNotes(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('notes') notes: string) {
    return this.service.updateParticipant(userId, id, { notes });
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participant' })
  addParticipant(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() body: { companyId: string; userId: string }) {
    return this.service.addParticipant(id, userId, body.companyId, body.userId);
  }

  @Delete(':id/participants/:participantId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove participant' })
  removeParticipant(@CurrentUser('sub') userId: string, @Param('id') id: string, @Param('participantId') participantId: string) {
    return this.service.removeParticipant(id, userId, participantId);
  }

  @Get(':id/audit-log')
  @ApiOperation({ summary: 'Get conversation audit log' })
  getAuditLog(@Param('id') id: string) {
    return this.service.getAuditLog(id);
  }
}
