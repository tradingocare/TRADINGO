import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LaunchService } from './launch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { AddIncidentUpdateDto } from './dto/add-incident-update.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@ApiTags('Incidents')
@Controller('launch/incidents')
export class IncidentsController {
  constructor(private readonly launchService: LaunchService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an incident' })
  async create(@Body() dto: CreateIncidentDto, @CurrentUser('sub') userId: string) {
    return this.launchService.createIncident(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List incidents' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.launchService.getIncidents({
      page: query.page,
      limit: query.limit,
      status: query.status,
      severity: query.severity,
    });
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active incidents (public status page)' })
  async getActive() {
    return this.launchService.getActiveIncidents();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get incident detail' })
  async findOne(@Param('id') id: string) {
    return this.launchService.getIncident(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update incident status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.launchService.updateIncidentStatus(id, dto, userId);
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add update to incident' })
  async addUpdate(
    @Param('id') id: string,
    @Body() dto: AddIncidentUpdateDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.launchService.addIncidentUpdate(id, dto, userId);
  }
}
