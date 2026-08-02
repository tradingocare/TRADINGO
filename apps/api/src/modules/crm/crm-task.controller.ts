import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmTaskService } from './crm-task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@ApiTags('CRM Task')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmTaskController {
  constructor(private readonly taskService: CrmTaskService) {}

  @Post(':leadId/tasks')
  @ApiOperation({ summary: 'Create task' })
  create(@Param('leadId') leadId: string, @Body() dto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create(leadId, dto, req.user.id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @Post('tasks/:id/complete')
  @ApiOperation({ summary: 'Complete task' })
  complete(@Param('id') id: string) {
    return this.taskService.complete(id);
  }

  @Get(':leadId/tasks')
  @ApiOperation({ summary: 'List lead tasks' })
  listByLead(@Param('leadId') leadId: string) {
    return this.taskService.listByLead(leadId);
  }

  @Get('tasks/my')
  @ApiOperation({ summary: 'Get my tasks' })
  myTasks(@Req() req: any) {
    return this.taskService.listByAssignee(req.user.id);
  }
}
