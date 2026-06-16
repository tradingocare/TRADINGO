import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpsertPreferenceDto } from './dto/notification-preference.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for a company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.findAll(companyId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @Param('companyId') companyId: string,
    @Query('userId') userId?: string,
  ) {
    return this.notificationService.getUnreadCount(companyId, userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(
    @Param('companyId') companyId: string,
    @Query('userId') userId: string,
  ) {
    return this.notificationService.getPreferences(companyId, userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Upsert notification preference' })
  async upsertPreference(
    @Param('companyId') companyId: string,
    @Query('userId') userId: string,
    @Body() dto: UpsertPreferenceDto,
  ) {
    return this.notificationService.upsertPreference(companyId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification details' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.findOne(companyId, id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(companyId, id);
  }

  @Post(':id/unread')
  @ApiOperation({ summary: 'Mark notification as unread' })
  async markAsUnread(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsUnread(companyId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @Param('companyId') companyId: string,
    @Body() dto: MarkReadDto,
  ) {
    if (dto.ids?.length) {
      return this.notificationService.markSpecificAsRead(companyId, dto.ids);
    }
    return this.notificationService.markAllAsRead(companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a notification' })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    await this.notificationService.softDelete(companyId, id);
    return { deleted: true };
  }
}
