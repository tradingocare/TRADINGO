import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoryTemplatesService } from './category-templates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@ApiTags('Category Templates')
@UseGuards(JwtAuthGuard)
@Controller('admin/templates')
export class CategoryTemplatesController {
  constructor(private readonly service: CategoryTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category template' })
  async create(@Body() dto: CreateTemplateDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all templates' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template with sections and fields' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template metadata' })
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a template with incremented version' })
  async duplicate(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.duplicate(id, userId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a template (archives other active for category)' })
  async activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export template as JSON' })
  async exportJson(@Param('id') id: string) {
    return this.service.exportJson(id);
  }

  @Post('import/:categoryId')
  @ApiOperation({ summary: 'Import template from JSON' })
  async importJson(@Param('categoryId') categoryId: string, @Body() data: any, @CurrentUser('sub') userId: string) {
    return this.service.importJson(categoryId, userId, data);
  }

  // ─── Sections ────────────────────────────────────────────────────

  @Post(':templateId/sections')
  @ApiOperation({ summary: 'Add a section to template' })
  async addSection(@Param('templateId') templateId: string, @Body() dto: CreateSectionDto) {
    return this.service.addSection(templateId, dto);
  }

  @Patch('sections/:sectionId')
  @ApiOperation({ summary: 'Update a section' })
  async updateSection(@Param('sectionId') sectionId: string, @Body() dto: UpdateSectionDto) {
    return this.service.updateSection(sectionId, dto);
  }

  @Delete('sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a section' })
  async removeSection(@Param('sectionId') sectionId: string) {
    await this.service.removeSection(sectionId);
  }

  // ─── Fields ──────────────────────────────────────────────────────

  @Post('sections/:sectionId/fields')
  @ApiOperation({ summary: 'Add a field to section' })
  async addField(@Param('sectionId') sectionId: string, @Body() dto: CreateFieldDto) {
    return this.service.addField(sectionId, dto);
  }

  @Patch('fields/:fieldId')
  @ApiOperation({ summary: 'Update a field' })
  async updateField(@Param('fieldId') fieldId: string, @Body() dto: UpdateFieldDto) {
    return this.service.updateField(fieldId, dto);
  }

  @Delete('fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a field' })
  async removeField(@Param('fieldId') fieldId: string) {
    await this.service.removeField(fieldId);
  }
}

@ApiTags('Category Templates')
@Controller('categories')
export class PublicTemplateController {
  constructor(private readonly service: CategoryTemplatesService) {}

  @Get(':categoryId/template')
  @Public()
  @ApiOperation({ summary: 'Get active template for a category' })
  async getActiveForCategory(@Param('categoryId') categoryId: string) {
    return this.service.getActiveForCategory(categoryId);
  }
}
