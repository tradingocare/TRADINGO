import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GlobalAttributeService } from '../services/global-attribute.service';
import { CreateGlobalAttributeDto, UpdateGlobalAttributeDto, QueryGlobalAttributeDto } from '../dto/global-attribute.dto';

@ApiTags('Global Attributes')
@Controller('enterprise-catalog/attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalAttributeController {
  constructor(private readonly attributeService: GlobalAttributeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a global attribute' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  create(@Body() dto: CreateGlobalAttributeDto, @CurrentUser() user: any) {
    return this.attributeService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all global attributes' })
  @Public()
  findAll(@Query() query: QueryGlobalAttributeDto) {
    return this.attributeService.findAll(query);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get attribute types' })
  @Public()
  getTypes() {
    return this.attributeService.getTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attribute by ID' })
  @Public()
  findById(@Param('id') id: string) {
    return this.attributeService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get attribute by slug' })
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.attributeService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a global attribute' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateGlobalAttributeDto, @CurrentUser() user: any) {
    return this.attributeService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a global attribute' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.attributeService.remove(id);
  }
}
