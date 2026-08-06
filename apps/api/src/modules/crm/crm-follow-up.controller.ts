import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmFollowUpService } from './crm-follow-up.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';

@ApiTags('CRM Follow-up')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmFollowUpController {
  constructor(private readonly fuService: CrmFollowUpService) {}

  @Post(':leadId/follow-ups')
  @ApiOperation({ summary: 'Create follow-up' })
  create(@Param('leadId') leadId: string, @Body() dto: CreateFollowUpDto, @Req() req: any) {
    return this.fuService.create(leadId, dto, req.user.id);
  }

  @Patch('follow-ups/:id')
  @ApiOperation({ summary: 'Update follow-up' })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.fuService.update(id, dto);
  }

  @Post('follow-ups/:id/complete')
  @ApiOperation({ summary: 'Complete follow-up' })
  complete(@Param('id') id: string) {
    return this.fuService.complete(id);
  }

  @Post('follow-ups/:id/escalate')
  @ApiOperation({ summary: 'Escalate follow-up' })
  escalate(@Param('id') id: string, @Body('escalatedTo') escalatedTo: string) {
    return this.fuService.escalate(id, escalatedTo);
  }

  @Get(':leadId/follow-ups')
  @ApiOperation({ summary: 'List lead follow-ups' })
  listByLead(@Param('leadId') leadId: string) {
    return this.fuService.listByLead(leadId);
  }

  @Get('follow-ups/my')
  @ApiOperation({ summary: 'Get my follow-ups' })
  myFollowUps(@Req() req: any) {
    return this.fuService.listByAssignee(req.user.id);
  }

  @Get('follow-ups/overdue')
  @ApiOperation({ summary: 'Get overdue follow-ups' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  overdue() {
    return this.fuService.getOverdue();
  }
}
