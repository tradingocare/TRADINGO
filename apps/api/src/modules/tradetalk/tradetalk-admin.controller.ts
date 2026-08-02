import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TradeTalkService } from './tradetalk.service';

@ApiTags('TradeTalk Admin')
@Controller('admin/tradetalk')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 120, ttl: 60000 } })
export class TradeTalkAdminController {
  constructor(private readonly tradetalkService: TradeTalkService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all community categories' })
  listAllCategories() {
    return this.tradetalkService.listCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a community category' })
  createCategory(@Body() dto: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number }) {
    return this.tradetalkService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a community category' })
  updateCategory(@Param('id') id: string, @Body() dto: { name?: string; slug?: string; description?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    return this.tradetalkService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a community category' })
  deleteCategory(@Param('id') id: string) {
    return this.tradetalkService.deleteCategory(id);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get community insights' })
  getCommunityInsights() {
    return this.tradetalkService.getCommunityInsights();
  }

  @Get('communities')
  @ApiOperation({ summary: 'List all communities' })
  listAllCommunities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.tradetalkService.discoverCommunities({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      isActive: isActive === 'false' ? false : isActive === 'true' ? true : undefined,
    });
  }
}
