import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AlertEngineService } from '../services/alert-engine.service';
import {
  AlertDefinitionDto, CreateAlertDefinitionDto, UpdateAlertDefinitionDto,
  AlertEventDto, AlertStatsDto, EvaluateAlertsResponseDto, AlertHistoryQueryDto,
} from '../dto/alert-engine.dto';

@Controller('founder/intelligence/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AlertEngineController {
  constructor(private readonly alertEngine: AlertEngineService) {}

  @Get('definitions')
  getDefinitions(): AlertDefinitionDto[] {
    return this.alertEngine.getDefinitions();
  }

  @Get('definitions/:id')
  getDefinition(@Param('id') id: string): AlertDefinitionDto | undefined {
    return this.alertEngine.getDefinition(id);
  }

  @Post('definitions')
  createDefinition(@Body() dto: CreateAlertDefinitionDto): AlertDefinitionDto {
    return this.alertEngine.createDefinition(dto);
  }

  @Patch('definitions/:id')
  updateDefinition(@Param('id') id: string, @Body() dto: UpdateAlertDefinitionDto): AlertDefinitionDto | null {
    return this.alertEngine.updateDefinition(id, dto);
  }

  @Delete('definitions/:id')
  deleteDefinition(@Param('id') id: string): { deleted: boolean } {
    return { deleted: this.alertEngine.deleteDefinition(id) };
  }

  @Post('evaluate')
  async evaluate(): Promise<EvaluateAlertsResponseDto> {
    return this.alertEngine.evaluateAllAlerts();
  }

  @Post(':eventId/acknowledge')
  acknowledge(@Param('eventId') eventId: string): AlertEventDto | null {
    return this.alertEngine.acknowledgeAlert(eventId);
  }

  @Post(':eventId/resolve')
  resolve(@Param('eventId') eventId: string): AlertEventDto | null {
    return this.alertEngine.resolveAlert(eventId);
  }

  @Get('history')
  getHistory(@Query() query: AlertHistoryQueryDto): AlertEventDto[] {
    return this.alertEngine.getAlertHistory(query);
  }

  @Get('stats')
  getStats(): AlertStatsDto {
    return this.alertEngine.getStats();
  }
}
