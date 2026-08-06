import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductCompletenessService {
  private readonly logger = new Logger(ProductCompletenessService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getCompleteness(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        media: true, specifications: true, attributes: true, priceSlabs: true,
        inventory: true, category: true, productBrand: true,
      },
    });
    if (!product) throw new Error('Product not found');

    const fields = this.assessFields(product);
    const totalFields = fields.length;
    const presentFields = fields.filter(f => f.status === 'present').length;
    const missingFields = fields.filter(f => f.status === 'missing').length;
    const incompleteFields = fields.filter(f => f.status === 'incomplete').length;
    const completionPercent = totalFields > 0 ? Math.round((presentFields / totalFields) * 100) : 0;

    return {
      productId,
      productName: product.name,
      completionPercent,
      totalFields,
      presentFields,
      missingFields,
      incompleteFields,
      fields,
      score: completionPercent,
      grade: completionPercent >= 80 ? 'A' : completionPercent >= 60 ? 'B' : completionPercent >= 40 ? 'C' : 'D',
    };
  }

  async getBulkCompleteness(productIds: string[]) {
    const results = [];
    for (const id of productIds) {
      try {
        results.push(await this.getCompleteness(id));
      } catch { /* skip failed */ }
    }
    return { results, total: results.length };
  }

  private assessFields(product: any) {
    const fields: Array<{ name: string; status: 'present' | 'missing' | 'incomplete'; importance: 'critical' | 'high' | 'medium' | 'low'; description: string }> = [];

    fields.push({ name: 'name', status: product.name?.length >= 10 ? 'present' : product.name ? 'incomplete' : 'missing', importance: 'critical', description: 'Product name (min 10 chars)' });
    fields.push({ name: 'shortDescription', status: product.shortDescription?.length >= 50 ? 'present' : product.shortDescription ? 'incomplete' : 'missing', importance: 'high', description: 'Short description (min 50 chars)' });
    fields.push({ name: 'description', status: product.description?.length >= 200 ? 'present' : product.description ? 'incomplete' : 'missing', importance: 'high', description: 'Full description (min 200 chars)' });
    fields.push({ name: 'sku', status: product.sku ? 'present' : 'missing', importance: 'high', description: 'SKU / product code' });
    fields.push({ name: 'category', status: product.categoryId ? 'present' : 'missing', importance: 'critical', description: 'Category assignment' });
    fields.push({ name: 'brand', status: product.brand || product.brandId ? 'present' : 'missing', importance: 'high', description: 'Brand name' });
    fields.push({ name: 'images', status: (product.media as Array<{ type: string }>)?.filter((m: { type: string }) => m.type === 'IMAGE')?.length >= 3 ? 'present' : (product.media as Array<unknown>)?.length >= 1 ? 'incomplete' : 'missing', importance: 'critical', description: 'Product images (min 3)' });
    fields.push({ name: 'specifications', status: product.specifications?.length >= 5 ? 'present' : product.specifications?.length >= 1 ? 'incomplete' : 'missing', importance: 'high', description: 'Technical specifications (min 5)' });
    fields.push({ name: 'attributes', status: product.attributes?.length >= 3 ? 'present' : product.attributes?.length >= 1 ? 'incomplete' : 'missing', importance: 'medium', description: 'Global attributes (min 3)' });
    fields.push({ name: 'pricing', status: product.priceSlabs?.length >= 1 || product.originalPrice ? 'present' : 'missing', importance: 'critical', description: 'Pricing information' });
    fields.push({ name: 'pricingSlabs', status: product.priceSlabs?.length >= 2 ? 'present' : product.priceSlabs?.length >= 1 ? 'incomplete' : 'missing', importance: 'medium', description: 'Volume-based pricing slabs (min 2)' });
    fields.push({ name: 'inventory', status: product.inventory ? 'present' : 'missing', importance: 'high', description: 'Inventory tracking' });
    fields.push({ name: 'moq', status: product.moq ? 'present' : 'missing', importance: 'medium', description: 'Minimum order quantity' });
    fields.push({ name: 'unit', status: product.unit ? 'present' : 'missing', importance: 'medium', description: 'Unit of measurement' });
    fields.push({ name: 'metaTitle', status: product.metaTitle ? 'present' : 'missing', importance: 'medium', description: 'SEO meta title' });
    fields.push({ name: 'metaDescription', status: product.metaDescription ? 'present' : 'missing', importance: 'medium', description: 'SEO meta description' });
    fields.push({ name: 'focusKeywords', status: product.focusKeywords?.length >= 3 ? 'present' : product.focusKeywords?.length >= 1 ? 'incomplete' : 'missing', importance: 'low', description: 'Focus keywords (min 3)' });
    fields.push({ name: 'videos', status: (product.media as Array<{ type: string }>)?.filter((m: { type: string }) => m.type === 'VIDEO')?.length >= 1 ? 'present' : 'missing', importance: 'low', description: 'Product video' });

    return fields;
  }
}
