import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HomepageService } from './homepage.service';

@ApiTags('Homepage')
@Controller('public')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Public()
  @Get('platform-stats')
  @ApiOperation({ summary: 'Get platform-wide aggregated stats for the homepage' })
  async getPlatformStats() {
    return this.homepageService.getPlatformStats();
  }

  @Public()
  @Get('city-stats')
  @ApiOperation({ summary: 'Get city-level aggregated stats for BusinessCities section' })
  async getCityStats() {
    return this.homepageService.getCityStats();
  }

  @Public()
  @Get('state-stats')
  @ApiOperation({ summary: 'Get state-level aggregated stats for IndiaHubs section' })
  async getStateStats() {
    return this.homepageService.getStateStats();
  }
}
