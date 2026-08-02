import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TrackingService } from './tracking.service';
import { TrackEventDto } from './dto';
import { Request } from 'express';

@ApiTags('Tracking')
@Controller('track')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Track an event (public)' })
  async track(@Body() dto: TrackEventDto, @Req() req: Request): Promise<{ queued: boolean }> {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    return this.trackingService.track({ ...dto, ipAddress, userAgent });
  }
}
