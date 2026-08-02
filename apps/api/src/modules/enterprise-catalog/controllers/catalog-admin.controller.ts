import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CatalogAdminService } from '../services/catalog-admin.service';

@ApiTags('Catalog Admin')
@Controller('enterprise-catalog/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get catalog admin dashboard' })
  getDashboard() {
    return this.catalogAdminService.getDashboard();
  }

  @Get('taxonomy-tree')
  @ApiOperation({ summary: 'Get taxonomy tree' })
  getTaxonomyTree() {
    return this.catalogAdminService.getTaxonomyTree();
  }
}
