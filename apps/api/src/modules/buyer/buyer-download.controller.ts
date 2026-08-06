import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { BuyerDownloadService } from './buyer-download.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDownloadDto } from './dto';

@ApiTags('Buyer — Downloads')
@Throttle(RateLimits.WRITE_GENERAL)
@UseGuards(JwtAuthGuard)
@Controller('buyer/downloads')
export class BuyerDownloadController {
  constructor(private readonly service: BuyerDownloadService) {}

  @Get()
  @ApiOperation({ summary: 'List downloads' })
  findAll(@CurrentUser('sub') userId: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.findAll(userId, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
  }

  @Post()
  @ApiOperation({ summary: 'Record a download' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDownloadDto) {
    return this.service.create(userId, dto);
  }
}
