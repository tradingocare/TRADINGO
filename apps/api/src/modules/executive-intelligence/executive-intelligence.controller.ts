import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { ExecutiveIntelligenceFacadeService } from './executive-intelligence.service';
import { HealthQueryDto } from './dto/executive-intelligence.dto';

@ApiTags('Executive Intelligence')
@Controller('founder/intelligence')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class ExecutiveIntelligenceController {
  constructor(private readonly facade: ExecutiveIntelligenceFacadeService) {}

  @Get('unified')
  @ApiOperation({ summary: 'Get unified founder dashboard — aggregates Founder AI, Enterprise Intelligence, Finance, Growth, and Analytics' })
  getUnifiedDashboard() {
    return this.facade.getUnifiedDashboard();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get platform health score with configurable weights and Redis caching' })
  getHealth(@Query() query: HealthQueryDto) {
    return this.facade.getHealth(query);
  }
}
