import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CrmSearchService } from './crm-search.service';
import { SearchCrmDto } from './dto';

@ApiTags('CRM Search')
@Throttle(RateLimits.ADMIN_ANALYTICS)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmSearchController {
  constructor(private readonly searchService: CrmSearchService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search CRM records' })
  search(@Query() dto: SearchCrmDto) {
    return this.searchService.search(dto);
  }
}
