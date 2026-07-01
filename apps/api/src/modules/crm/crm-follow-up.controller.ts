import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmFollowUpService } from './crm-follow-up.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmFollowUpController {
  constructor(private readonly fuService: CrmFollowUpService) {}

  @Post(':leadId/follow-ups')
  create(@Param('leadId') leadId: string, @Body() dto: CreateFollowUpDto, @Req() req: any) {
    return this.fuService.create(leadId, dto, req.user.id);
  }

  @Patch('follow-ups/:id')
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.fuService.update(id, dto);
  }

  @Post('follow-ups/:id/complete')
  complete(@Param('id') id: string) {
    return this.fuService.complete(id);
  }

  @Post('follow-ups/:id/escalate')
  escalate(@Param('id') id: string, @Body('escalatedTo') escalatedTo: string) {
    return this.fuService.escalate(id, escalatedTo);
  }

  @Get(':leadId/follow-ups')
  listByLead(@Param('leadId') leadId: string) {
    return this.fuService.listByLead(leadId);
  }

  @Get('follow-ups/my')
  myFollowUps(@Req() req: any) {
    return this.fuService.listByAssignee(req.user.id);
  }

  @Get('follow-ups/overdue')
  @Roles('ADMIN', 'SUPER_ADMIN')
  overdue() {
    return this.fuService.getOverdue();
  }
}
