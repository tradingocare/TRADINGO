import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdvertisingService } from './advertising.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateAdvertisingDto, UpdateAdvertisingDto, QueryAdvertisingDto, FundAdvertisingDto } from './dto';
import { AdType } from '@prisma/client';

@ApiTags('Advertising')
@Controller('advertising')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @Post()
  @ApiOperation({ summary: 'Create advertisement' })
  async create(@Body() dto: CreateAdvertisingDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId || user.companies?.[0]?.id;
    return this.advertisingService.create(dto, companyId!, user.sub);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my advertisements' })
  async myAds(@Query() query: QueryAdvertisingDto, @CurrentUser() user: AuthUser) {
    const companyId = user.companyId || user.companies?.[0]?.id;
    return this.advertisingService.findMyAds(companyId!, query);
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'Get my advertisement stats' })
  async myStats(@CurrentUser() user: AuthUser) {
    const companyId = user.companyId || user.companies?.[0]?.id;
    return this.advertisingService.getSellerDashboard(companyId!);
  }

  @Get('placements')
  @ApiOperation({ summary: 'Get ad placements' })
  async getPlacements(@Query('type') type: AdType, @Query('limit') limit?: number) {
    return this.advertisingService.getPlacements(type, limit || 10);
  }

  @Post(':id/fund')
  @ApiOperation({ summary: 'Fund advertisement campaign' })
  async fund(@Param('id') id: string, @Body() dto: FundAdvertisingDto, @CurrentUser() user: AuthUser) {
    return this.advertisingService.fund(id, dto.amount, user.sub);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause advertisement' })
  async pause(@Param('id') id: string) {
    return this.advertisingService.pause(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume advertisement' })
  async resume(@Param('id') id: string) {
    return this.advertisingService.resume(id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop advertisement' })
  async stop(@Param('id') id: string) {
    return this.advertisingService.stop(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advertisement by ID' })
  async findOne(@Param('id') id: string) {
    return this.advertisingService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update advertisement' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdvertisingDto) {
    return this.advertisingService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete advertisement' })
  async remove(@Param('id') id: string) {
    return this.advertisingService.delete(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get advertisement analytics' })
  async analytics(@Param('id') id: string) {
    return this.advertisingService.getAnalytics(id);
  }

  @Post(':id/impression')
  @ApiOperation({ summary: 'Record advertisement impression' })
  async impression(@Param('id') id: string) {
    return this.advertisingService.recordImpression(id);
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Record advertisement click' })
  async click(@Param('id') id: string) {
    return this.advertisingService.recordClick(id);
  }
}
