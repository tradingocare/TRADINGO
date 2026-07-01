import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdvertisingService } from './advertising.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAdvertisingDto, UpdateAdvertisingDto, QueryAdvertisingDto, FundAdvertisingDto } from './dto';
import { AdType } from '@prisma/client';

@Controller('advertising')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @Post()
  async create(@Body() dto: CreateAdvertisingDto, @CurrentUser() user: any) {
    const companyId = user.companyId || (user.companies?.[0]?.id);
    return this.advertisingService.create(dto, companyId, user.sub);
  }

  @Get('my')
  async myAds(@Query() query: QueryAdvertisingDto, @CurrentUser() user: any) {
    const companyId = user.companyId || (user.companies?.[0]?.id);
    return this.advertisingService.findMyAds(companyId, query);
  }

  @Get('my/stats')
  async myStats(@CurrentUser() user: any) {
    const companyId = user.companyId || (user.companies?.[0]?.id);
    return this.advertisingService.getSellerDashboard(companyId);
  }

  @Get('placements')
  async getPlacements(@Query('type') type: AdType, @Query('limit') limit?: number) {
    return this.advertisingService.getPlacements(type, limit || 10);
  }

  @Post(':id/fund')
  async fund(@Param('id') id: string, @Body() dto: FundAdvertisingDto, @CurrentUser() user: any) {
    return this.advertisingService.fund(id, dto.amount, user.sub);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.advertisingService.pause(id);
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    return this.advertisingService.resume(id);
  }

  @Post(':id/stop')
  async stop(@Param('id') id: string) {
    return this.advertisingService.stop(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.advertisingService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdvertisingDto) {
    return this.advertisingService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.advertisingService.delete(id);
  }

  @Get(':id/analytics')
  async analytics(@Param('id') id: string) {
    return this.advertisingService.getAnalytics(id);
  }

  @Post(':id/impression')
  async impression(@Param('id') id: string) {
    return this.advertisingService.recordImpression(id);
  }

  @Post(':id/click')
  async click(@Param('id') id: string) {
    return this.advertisingService.recordClick(id);
  }
}
