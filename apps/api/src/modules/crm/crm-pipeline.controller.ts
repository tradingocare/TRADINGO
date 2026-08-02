import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmPipelineService } from './crm-pipeline.service';
import { CreatePipelineStageDto, UpdatePipelineStageDto } from './dto';

@ApiTags('CRM Pipeline')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmPipelineController {
  constructor(private readonly pipelineService: CrmPipelineService) {}

  @Get('pipeline-stages')
  @ApiOperation({ summary: 'Get pipeline stages' })
  getStages() {
    return this.pipelineService.getStages();
  }

  @Post('pipeline-stages')
  @ApiOperation({ summary: 'Create pipeline stage' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  createStage(@Body() dto: CreatePipelineStageDto) {
    return this.pipelineService.createStage(dto);
  }

  @Patch('pipeline-stages/:id')
  @ApiOperation({ summary: 'Update pipeline stage' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateStage(@Param('id') id: string, @Body() dto: UpdatePipelineStageDto) {
    return this.pipelineService.updateStage(id, dto);
  }

  @Delete('pipeline-stages/:id')
  @ApiOperation({ summary: 'Delete pipeline stage' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteStage(@Param('id') id: string) {
    return this.pipelineService.deleteStage(id);
  }

  @Post('pipeline-stages/reorder')
  @ApiOperation({ summary: 'Reorder pipeline stages' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  reorderStages(@Body('order') order: string[]) {
    return this.pipelineService.reorderStages(order);
  }
}
