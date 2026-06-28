import { Controller, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuyerNotificationService } from './buyer-notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Buyer — Notifications')
@UseGuards(JwtAuthGuard)
@Controller('buyer/notifications')
export class BuyerNotificationController {
  constructor(private readonly service: BuyerNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  findAll(@CurrentUser('sub') userId: string, @Query('type') type?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.findAll(userId, type, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.markRead(userId, id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.service.markAllRead(userId);
  }
}
