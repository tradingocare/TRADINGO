import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuyerDownloadService } from './buyer-download.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Buyer — Downloads')
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
  create(@CurrentUser('sub') userId: string, @Body() body: { type: string; title: string; fileUrl: string; fileSize?: number; sourceId?: string; sourceModule?: string }) {
    return this.service.create(userId, body);
  }
}
