import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveAttributesDto } from './dto/save-attributes.dto';

@Injectable()
export class ProductAttributesService {
  private readonly logger = new Logger(ProductAttributesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');

    const attributes = await this.prisma.productAttribute.findMany({
      where: { productId },
      include: { field: { select: { key: true, label: true, type: true, section: { select: { key: true, title: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });

    const grouped: Record<string, any[]> = {};
    for (const attr of attributes) {
      const sectionKey = attr.field.section?.key || 'other';
      if (!grouped[sectionKey]) grouped[sectionKey] = [];
      grouped[sectionKey].push({
        id: attr.id,
        fieldKey: attr.fieldKey,
        fieldLabel: attr.field.label,
        fieldType: attr.field.type,
        value: attr.value,
      });
    }

    return grouped;
  }

  async save(productId: string, dto: SaveAttributesDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true, categoryId: true } });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.categoryId) throw new NotFoundException('Product has no category');

    const template = await this.prisma.categoryTemplate.findFirst({
      where: { categoryId: product.categoryId, status: 'ACTIVE' },
      include: { sections: { include: { fields: true } } },
    });
    if (!template) throw new NotFoundException('No active template for this product category');

    const tpl = template as any;
    const fieldMap = new Map<string, string>();
    for (const section of tpl.sections) {
      for (const field of section.fields) {
        fieldMap.set(field.key, field.id);
      }
    }

    const results = [];
    for (const attr of dto.attributes) {
      const fieldId = fieldMap.get(attr.fieldKey);
      if (!fieldId) {
        this.logger.warn(`Field key "${attr.fieldKey}" not found in active template for product ${productId}`);
        continue;
      }

      const result = await this.prisma.productAttribute.upsert({
        where: { productId_fieldKey: { productId, fieldKey: attr.fieldKey } },
        create: { productId, fieldId, fieldKey: attr.fieldKey, value: attr.value },
        update: { value: attr.value, fieldId },
      });
      results.push(result);
    }

    return results;
  }

  async remove(productId: string, fieldKey: string) {
    const existing = await this.prisma.productAttribute.findUnique({
      where: { productId_fieldKey: { productId, fieldKey } },
    });
    if (!existing) throw new NotFoundException('Attribute not found');

    await this.prisma.productAttribute.delete({ where: { id: existing.id } });
  }

  async initFromTemplate(productId: string, templateId: string) {
    const template = await this.prisma.categoryTemplate.findUnique({
      where: { id: templateId },
      include: { sections: { include: { fields: true } } },
    });
    if (!template) throw new NotFoundException('Template not found');

    const defaults = [];
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.defaultValue !== null && field.defaultValue !== undefined) {
          defaults.push({
            productId,
            fieldId: field.id,
            fieldKey: field.key,
            value: field.defaultValue,
          });
        }
      }
    }

    if (defaults.length > 0) {
      await this.prisma.productAttribute.createMany({ data: defaults, skipDuplicates: true });
    }
  }
}
