import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmService } from './crm.service';
import { CreateLeadDto, UpdateLeadDto, QueryLeadDto } from './dto';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.crmService.createLead(dto, req.user.id);
  }

  @Get()
  list(@Query() query: QueryLeadDto) {
    return this.crmService.listLeads(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.crmService.getLead(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.crmService.updateLead(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.crmService.deleteLead(id);
  }

  @Post(':id/convert')
  convert(@Param('id') id: string, @Body('companyId') companyId?: string) {
    return this.crmService.convertLead(id, companyId);
  }

  @Post(':id/mark-lost')
  markLost(@Param('id') id: string, @Body('reason') reason: string) {
    return this.crmService.markLost(id, reason);
  }

  @Post(':id/reassign')
  reassign(@Param('id') id: string, @Body('ownerId') ownerId: string) {
    return this.crmService.reassignLead(id, ownerId);
  }

  @Post(':id/recalculate-score')
  recalculateScore(@Param('id') id: string) {
    return this.crmService.recalculateScore(id);
  }
}
