import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LaunchService } from './launch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { VerifyChecklistDto } from './dto/verify-checklist.dto';

@ApiTags('Launch Checklist')
@Controller('launch/checklist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class LaunchChecklistController {
  constructor(private readonly launchService: LaunchService) {}

  @Get()
  @ApiOperation({ summary: 'List all checklist items' })
  async getItems() {
    return this.launchService.getChecklistItems();
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get checklist statuses' })
  async getStatuses(@Query('companyId') companyId?: string) {
    return this.launchService.getChecklistStatuses(companyId);
  }

  @Patch(':itemId/status')
  @ApiOperation({ summary: 'Update checklist item status' })
  async updateStatus(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.launchService.updateChecklistStatus(itemId, dto.status, userId, dto.notes);
  }

  @Post(':itemId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify checklist item' })
  async verifyItem(
    @Param('itemId') itemId: string,
    @Body() _dto: VerifyChecklistDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.launchService.verifyChecklistItem(itemId, userId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get checklist progress summary' })
  async getProgress() {
    return this.launchService.getChecklistProgress();
  }
}
