import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationService } from './notification.service';
import { SubscribeDto } from './dto/create-newsletter.dto';

@ApiTags('Public Notifications')
@Controller('notifications')
export class PublicNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Public()
  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter (public)' })
  async subscribe(@Body() dto: SubscribeDto) {
    return this.notificationService.subscribe(dto);
  }

  @Public()
  @Post('newsletter/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter (public)' })
  async unsubscribe(@Body('email') email: string) {
    return this.notificationService.unsubscribe(email);
  }

  @Get('newsletter/subscribers')
  @ApiOperation({ summary: 'List newsletter subscribers (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listSubscribers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.listSubscribers({ status, search, page, limit });
  }

  @Get('newsletter/subscribers/stats')
  @ApiOperation({ summary: 'Newsletter subscriber stats (admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSubscriberStats() {
    return this.notificationService.getSubscriberStats();
  }
}
