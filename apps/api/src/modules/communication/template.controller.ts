import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication Hub — Saved Templates')
@UseGuards(JwtAuthGuard)
@Controller('communication/templates')
export class TemplateController {
  constructor(private readonly service: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List saved templates' })
  findAll(@CurrentUser('companyId') companyId: string, @Query('category') category?: string) {
    return this.service.findAll(companyId, category);
  }

  @Post()
  @ApiOperation({ summary: 'Create a template' })
  create(@CurrentUser('companyId') companyId: string, @Body() body: { title: string; content: string; category?: string; isShared?: boolean }) {
    return this.service.create(companyId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  update(@CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, companyId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a template' })
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.service.remove(id, companyId);
  }
}
