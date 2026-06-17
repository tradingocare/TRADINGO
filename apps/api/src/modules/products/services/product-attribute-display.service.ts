import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../common/services/redis.service';
import { ProductAttributeDisplayDto, AttributeSectionDto, AttributeFieldDto } from '../dto/product-attribute-display.dto';

const CACHE_TTL = 3600;

@Injectable()
export class ProductAttributeDisplayService {
  private readonly logger = new Logger(ProductAttributeDisplayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getDisplayAttributes(productId: string, categoryId?: string): Promise<ProductAttributeDisplayDto> {
    const cacheKey = `product:attributes:${productId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.buildDisplayAttributes(productId, categoryId);

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    return result;
  }

  async invalidateCache(productId: string) {
    await this.redis.del(`product:attributes:${productId}`);
  }

  private async buildDisplayAttributes(productId: string, categoryId?: string): Promise<ProductAttributeDisplayDto> {
    if (!categoryId) return { sections: [], flattened: {} };

    const template = await this.prisma.categoryTemplate.findFirst({
      where: { categoryId, status: 'ACTIVE' as any },
      include: {
        sections: {
          where: { isActive: true },
          include: {
            fields: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!template) return { sections: [], flattened: {} };

    const attributes = await this.prisma.productAttribute.findMany({
      where: { productId },
    });

    const attrMap = new Map<string, any>();
    for (const attr of attributes) {
      attrMap.set(attr.fieldKey, attr.value);
    }

    const sections: AttributeSectionDto[] = [];
    const flattened: Record<string, any> = {};

    for (const section of template.sections) {
      const sectionFields: AttributeFieldDto[] = [];

      for (const field of section.fields) {
        const rawValue = attrMap.get(field.key) ?? null;
        const displayValue = this.formatValue(field.type, rawValue, field.options as any);

        sectionFields.push({
          fieldId: field.id,
          key: field.key,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || undefined,
          helpText: field.helpText || undefined,
          unit: field.unit || undefined,
          isRequired: field.isRequired || undefined,
          options: field.options as any,
          displayValue,
          rawValue,
        });

        flattened[field.key] = displayValue;
      }

      if (sectionFields.length > 0) {
        sections.push({
          sectionId: section.id,
          sectionKey: section.key,
          sectionTitle: section.title,
          sectionDescription: section.description || undefined,
          sectionIcon: section.icon || undefined,
          sortOrder: section.sortOrder,
          fields: sectionFields,
        });
      }
    }

    return {
      template: {
        id: template.id,
        name: template.name,
        version: template.version,
      },
      sections,
      flattened,
    };
  }

  private formatValue(type: string, rawValue: any, _options?: any): any {
    if (rawValue === null || rawValue === undefined) return null;

    switch (type) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'RICH_TEXT':
        return String(rawValue);

      case 'NUMBER':
      case 'PRICE': {
        const num = Number(rawValue);
        return isNaN(num) ? rawValue : num;
      }

      case 'SELECT':
      case 'RADIO':
        return String(rawValue);

      case 'MULTI_SELECT':
      case 'TAGS': {
        if (Array.isArray(rawValue)) return rawValue.map(String);
        if (typeof rawValue === 'string') return rawValue.split(',').map(s => s.trim()).filter(Boolean);
        return [];
      }

      case 'CHECKBOX':
        return rawValue === true || rawValue === 'true' || rawValue === 1 || rawValue === '1' || rawValue === 'yes';

      case 'DATE': {
        const d = new Date(rawValue);
        return isNaN(d.getTime()) ? String(rawValue) : d.toISOString().split('T')[0];
      }

      case 'URL':
        return String(rawValue);

      case 'PHONE':
        return String(rawValue);

      case 'FILE':
      case 'IMAGE':
      case 'VIDEO':
      case 'PDF':
        if (typeof rawValue === 'string') return rawValue;
        if (typeof rawValue === 'object' && rawValue !== null) return rawValue;
        return null;

      case 'LOCATION':
        if (typeof rawValue === 'object' && rawValue !== null) {
          return {
            lat: Number(rawValue.lat) || Number(rawValue.latitude) || 0,
            lng: Number(rawValue.lng) || Number(rawValue.longitude) || 0,
            address: String(rawValue.address || rawValue.address || ''),
          };
        }
        return null;

      case 'JSON':
        return rawValue;

      default:
        return rawValue;
    }
  }
}
