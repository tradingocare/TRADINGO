import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@Injectable()
export class CategoryTemplatesService {
  private readonly logger = new Logger(CategoryTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Template CRUD ───────────────────────────────────────────────

  async create(dto: CreateTemplateDto, userId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const existing = await this.prisma.categoryTemplate.findFirst({
      where: { categoryId: dto.categoryId, status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });

    const template = await this.prisma.categoryTemplate.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        version: existing ? existing.version + 1 : 1,
        status: dto.status || 'DRAFT',
        createdBy: userId,
      },
      include: { sections: { include: { fields: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } },
    });

    return template;
  }

  async findAll() {
    return this.prisma.categoryTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: { select: { id: true, name: true, slug: true } }, _count: { select: { sections: true } } },
    });
  }

  async findById(id: string) {
    const template = await this.prisma.categoryTemplate.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            fields: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.categoryTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.categoryTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: { sections: { include: { fields: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async remove(id: string) {
    const template = await this.prisma.categoryTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    await this.prisma.categoryTemplate.delete({ where: { id } });
  }

  async duplicate(id: string, userId: string) {
    const source = await this.prisma.categoryTemplate.findUnique({
      where: { id },
      include: { sections: { include: { fields: true } } },
    });
    if (!source) throw new NotFoundException('Template not found');

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.categoryTemplate.create({
        data: {
          categoryId: source.categoryId,
          name: `${source.name} (copy)`,
          version: source.version + 1,
          status: 'DRAFT',
          createdBy: userId,
        },
      });

      for (const section of source.sections.sort((a, b) => a.sortOrder - b.sortOrder)) {
        const newSection = await tx.templateSection.create({
          data: {
            templateId: template.id,
            key: section.key,
            title: section.title,
            description: section.description,
            sortOrder: section.sortOrder,
            icon: section.icon,
          },
        });

        for (const field of section.fields.sort((a, b) => a.sortOrder - b.sortOrder)) {
          await tx.templateField.create({
            data: {
              sectionId: newSection.id,
              key: field.key,
              label: field.label,
              type: field.type,
              placeholder: field.placeholder,
              helpText: field.helpText,
              defaultValue: field.defaultValue as any,
              options: field.options as any,
              unit: field.unit,
              validation: field.validation as any,
              visibility: field.visibility as any,
              metadata: field.metadata as any,
              sortOrder: field.sortOrder,
              isRequired: field.isRequired,
            },
          });
        }
      }

      return tx.categoryTemplate.findUnique({
        where: { id: template.id },
        include: { sections: { include: { fields: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async activate(id: string) {
    const template = await this.prisma.categoryTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.categoryTemplate.updateMany({
        where: { categoryId: template.categoryId, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' },
      });

      return tx.categoryTemplate.update({
        where: { id },
        data: { status: 'ACTIVE' },
        include: { sections: { include: { fields: true }, orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async getActiveForCategory(categoryId: string) {
    const template = await this.prisma.categoryTemplate.findFirst({
      where: { categoryId, status: 'ACTIVE' },
      orderBy: { version: 'desc' },
      include: {
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            fields: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    return template;
  }

  // ─── Sections ────────────────────────────────────────────────────

  async addSection(templateId: string, dto: CreateSectionDto) {
    const template = await this.prisma.categoryTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');

    return this.prisma.templateSection.create({
      data: {
        templateId,
        key: dto.key,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        icon: dto.icon,
      },
    });
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto) {
    const section = await this.prisma.templateSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.templateSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.key !== undefined && { key: dto.key }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async removeSection(sectionId: string) {
    const section = await this.prisma.templateSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    await this.prisma.templateSection.delete({ where: { id: sectionId } });
  }

  // ─── Fields ──────────────────────────────────────────────────────

  async addField(sectionId: string, dto: CreateFieldDto) {
    const section = await this.prisma.templateSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.templateField.create({
      data: {
        sectionId,
        key: dto.key,
        label: dto.label,
        type: dto.type,
        placeholder: dto.placeholder,
        helpText: dto.helpText,
        defaultValue: dto.defaultValue ?? undefined,
        options: dto.options ?? undefined,
        unit: dto.unit,
        validation: dto.validation ?? undefined,
        visibility: dto.visibility ?? undefined,
        metadata: dto.metadata ?? undefined,
        sortOrder: dto.sortOrder ?? 0,
        isRequired: dto.isRequired ?? false,
      },
    });
  }

  async updateField(fieldId: string, dto: UpdateFieldDto) {
    const field = await this.prisma.templateField.findUnique({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Field not found');

    return this.prisma.templateField.update({
      where: { id: fieldId },
      data: {
        ...(dto.key !== undefined && { key: dto.key }),
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.placeholder !== undefined && { placeholder: dto.placeholder }),
        ...(dto.helpText !== undefined && { helpText: dto.helpText }),
        ...(dto.defaultValue !== undefined && { defaultValue: dto.defaultValue }),
        ...(dto.options !== undefined && { options: dto.options }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.validation !== undefined && { validation: dto.validation }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async removeField(fieldId: string) {
    const field = await this.prisma.templateField.findUnique({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Field not found');

    await this.prisma.templateField.delete({ where: { id: fieldId } });
  }

  // ─── JSON Import/Export ──────────────────────────────────────────

  async exportJson(id: string) {
    const template = await this.prisma.categoryTemplate.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            fields: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    if (!template) throw new NotFoundException('Template not found');

    return {
      name: template.name,
      categorySlug: template.category.slug,
      version: template.version,
      sections: template.sections.map((s) => ({
        key: s.key,
        title: s.title,
        description: s.description,
        sortOrder: s.sortOrder,
        icon: s.icon,
        fields: s.fields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          helpText: f.helpText,
          defaultValue: f.defaultValue,
          options: f.options,
          unit: f.unit,
          validation: f.validation,
          visibility: f.visibility,
          metadata: f.metadata,
          sortOrder: f.sortOrder,
          isRequired: f.isRequired,
        })),
      })),
    };
  }

  async importJson(categoryId: string, userId: string, data: any) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const existing = await this.prisma.categoryTemplate.findFirst({
      where: { categoryId, status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.categoryTemplate.create({
        data: {
          categoryId,
          name: data.name || 'Imported Template',
          version: existing ? existing.version + 1 : 1,
          status: 'DRAFT',
          createdBy: userId,
        },
      });

      for (const section of data.sections || []) {
        const newSection = await tx.templateSection.create({
          data: {
            templateId: template.id,
            key: section.key,
            title: section.title,
            description: section.description,
            sortOrder: section.sortOrder ?? 0,
            icon: section.icon,
          },
        });

        for (const field of section.fields || []) {
          await tx.templateField.create({
            data: {
              sectionId: newSection.id,
              key: field.key,
              label: field.label,
              type: field.type,
              placeholder: field.placeholder,
              helpText: field.helpText,
              defaultValue: field.defaultValue ?? undefined,
              options: field.options ?? undefined,
              unit: field.unit,
              validation: field.validation ?? undefined,
              visibility: field.visibility ?? undefined,
              metadata: field.metadata ?? undefined,
              sortOrder: field.sortOrder ?? 0,
              isRequired: field.isRequired ?? false,
            },
          });
        }
      }

      return tx.categoryTemplate.findUnique({
        where: { id: template.id },
        include: { sections: { include: { fields: true }, orderBy: { sortOrder: 'asc' } } },
      });
    });
  }
}
