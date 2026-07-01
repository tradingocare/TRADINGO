import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmTaskService } from './crm-task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmTaskController {
  constructor(private readonly taskService: CrmTaskService) {}

  @Post(':leadId/tasks')
  create(@Param('leadId') leadId: string, @Body() dto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create(leadId, dto, req.user.id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @Post('tasks/:id/complete')
  complete(@Param('id') id: string) {
    return this.taskService.complete(id);
  }

  @Get(':leadId/tasks')
  listByLead(@Param('leadId') leadId: string) {
    return this.taskService.listByLead(leadId);
  }

  @Get('tasks/my')
  myTasks(@Req() req: any) {
    return this.taskService.listByAssignee(req.user.id);
  }
}
