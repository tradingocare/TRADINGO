import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GocashEcosystemService } from './gocash-ecosystem.service';
import { CreateMissionDto, UpdateMissionDto, CreateAchievementDto, UpdateAchievementDto, CreateBadgeDto, UpdateBadgeDto } from './dto';

@ApiTags('GOCASH Ecosystem Admin')
@Controller('admin/ecosystem')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminEcosystemController {
  constructor(private readonly service: GocashEcosystemService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get ecosystem admin dashboard' })
  async getDashboard() {
    return this.service.getAdminDashboard();
  }

  @Get('xp-chart')
  @ApiOperation({ summary: 'Get XP chart data' })
  async getXpChart(@Query('days') days?: string) {
    return this.service.getAdminXpChart(days ? parseInt(days) : 30);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed ecosystem data' })
  async seedData() {
    await this.service.seedInitialData();
    return { message: 'Seed data created successfully' };
  }

  @Post('missions')
  @ApiOperation({ summary: 'Create mission' })
  async createMission(@Body() dto: CreateMissionDto) {
    return this.service.createMission(dto);
  }

  @Patch('missions/:id')
  @ApiOperation({ summary: 'Update mission' })
  async updateMission(@Param('id') id: string, @Body() dto: UpdateMissionDto) {
    return this.service.updateMission(id, dto);
  }

  @Delete('missions/:id')
  @ApiOperation({ summary: 'Delete mission' })
  async deleteMission(@Param('id') id: string) {
    await this.service.deleteMission(id);
    return { message: 'Mission deleted' };
  }

  @Post('achievements')
  @ApiOperation({ summary: 'Create achievement' })
  async createAchievement(@Body() dto: CreateAchievementDto) {
    return this.service.createAchievement(dto);
  }

  @Patch('achievements/:id')
  @ApiOperation({ summary: 'Update achievement' })
  async updateAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto) {
    return this.service.updateAchievement(id, dto);
  }

  @Delete('achievements/:id')
  @ApiOperation({ summary: 'Delete achievement' })
  async deleteAchievement(@Param('id') id: string) {
    await this.service.deleteAchievement(id);
    return { message: 'Achievement deleted' };
  }

  @Post('badges')
  @ApiOperation({ summary: 'Create badge' })
  async createBadge(@Body() dto: CreateBadgeDto) {
    return this.service.createBadge(dto);
  }

  @Patch('badges/:id')
  @ApiOperation({ summary: 'Update badge' })
  async updateBadge(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.service.updateBadge(id, dto);
  }

  @Delete('badges/:id')
  @ApiOperation({ summary: 'Delete badge' })
  async deleteBadge(@Param('id') id: string) {
    await this.service.deleteBadge(id);
    return { message: 'Badge deleted' };
  }
}
