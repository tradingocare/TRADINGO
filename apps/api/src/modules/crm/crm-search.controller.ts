import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmSearchService } from './crm-search.service';
import { SearchCrmDto } from './dto';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmSearchController {
  constructor(private readonly searchService: CrmSearchService) {}

  @Get('search')
  search(@Query() dto: SearchCrmDto) {
    return this.searchService.search(dto);
  }
}
