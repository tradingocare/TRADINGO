import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { FounderExecutiveAgentService } from './executive-agent.service';
import { RiskReportDto, AgentCoordinationDto } from './dto/executive-agent.dto';

@ApiTags('Executive Agent')
@Controller('founder/executive')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class FounderExecutiveAgentController {
  constructor(private readonly executive: FounderExecutiveAgentService) {}

  @ApiOperation({ summary: 'Get executive copilot' })
  @Get('copilot')
  getCopilot() {
    return this.executive.getExecutiveCopilot();
  }

  @ApiOperation({ summary: 'Get decision center' })
  @Get('decision-center')
  getDecisionCenter() {
    return this.executive.getDecisionCenter();
  }

  @ApiOperation({ summary: 'Get executive KPI dashboard' })
  @Get('kpi')
  getKpi() {
    return this.executive.getExecutiveKpi();
  }

  @ApiOperation({ summary: 'Get executive risk report' })
  @Get('risks')
  getRisks(@Query() query: RiskReportDto) {
    return this.executive.getRiskEngine(query.timeframe);
  }

  @ApiOperation({ summary: 'Get executive opportunities' })
  @Get('opportunities')
  getOpportunities() {
    return this.executive.getOpportunityEngine();
  }

  @ApiOperation({ summary: 'Get executive analytics' })
  @Get('analytics')
  getAnalytics() {
    return this.executive.getExecutiveAnalytics();
  }

  @ApiOperation({ summary: 'Coordinate with another agent' })
  @Post('coordinate')
  coordinate(@Body() dto: AgentCoordinationDto) {
    return this.executive.coordinateWithAgent(dto.targetAgentId, dto.action, dto.payload);
  }
}

@ApiTags('Executive Agent Admin')
@Controller('admin/founder/executive')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminExecutiveAgentController {
  constructor(private readonly executive: FounderExecutiveAgentService) {}

  @ApiOperation({ summary: 'Get executive admin dashboard' })
  @Get('dashboard')
  getDashboard() {
    return this.executive.getExecutiveCopilot();
  }

  @ApiOperation({ summary: 'Get executive admin KPI' })
  @Get('kpi')
  getKpi() {
    return this.executive.getExecutiveKpi();
  }
}
