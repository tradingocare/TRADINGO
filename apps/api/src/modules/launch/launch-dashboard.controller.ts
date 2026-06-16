import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LaunchService } from './launch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Launch Dashboard')
@Controller('launch')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaunchDashboardController {
  constructor(private readonly launchService: LaunchService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get launch dashboard aggregate metrics' })
  async getDashboard() {
    return this.launchService.getLaunchDashboard();
  }

  @Get('metrics/companies')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get company metrics' })
  async getCompanyMetrics() {
    return this.launchService.getCompanyMetrics();
  }

  @Get('metrics/products')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get product metrics' })
  async getProductMetrics() {
    return this.launchService.getProductMetrics();
  }

  @Get('metrics/search')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get search metrics' })
  async getSearchMetrics() {
    return this.launchService.getSearchMetrics();
  }

  @Get('metrics/traffic')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get traffic metrics' })
  async getTrafficMetrics() {
    return this.launchService.getTrafficMetrics();
  }

  @Get('metrics/conversion')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get conversion metrics' })
  async getConversionMetrics() {
    return this.launchService.getConversionMetrics();
  }
}
