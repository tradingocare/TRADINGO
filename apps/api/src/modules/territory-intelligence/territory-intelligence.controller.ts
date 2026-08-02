import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TerritoryIntelligenceService, TerritoryNode } from './territory-intelligence.service';
import { CreateTerritoryDto, UpdateTerritoryDto } from './dto/territory.dto';

@ApiTags('Territory Intelligence')
@Controller('territory-intelligence')
export class TerritoryIntelligenceController {
  constructor(private readonly territoryIntelligence: TerritoryIntelligenceService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get territory tree' })
  async getTree(): Promise<TerritoryNode[]> {
    return this.territoryIntelligence.getTree();
  }

  @Get('coverage')
  @ApiOperation({ summary: 'Get territory coverage analytics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCoverage() {
    return this.territoryIntelligence.getCoverageAnalytics();
  }

  @Get('rm/:rmId')
  @ApiOperation({ summary: 'Get RM territories' })
  async getRmTerritories(@Param('rmId') rmId: string) {
    return this.territoryIntelligence.getRmTerritories(rmId);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company territory' })
  async getCompanyTerritory(@Param('companyId') companyId: string) {
    return this.territoryIntelligence.getCompanyTerritory(companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a territory' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() body: CreateTerritoryDto) {
    return this.territoryIntelligence.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a territory' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() body: UpdateTerritoryDto) {
    return this.territoryIntelligence.update(id, body as any);
  }
}
