import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  description(productName: string, category: string, brand: string, specs: string[], features: string[], targetAudience: string, tone: string): string {
    return `Generate a product description for "${productName}" (Brand: ${brand}, Category: ${category}).

Specifications: ${specs.join(', ')}
Key Features: ${features.join(', ')}
Target Audience: ${targetAudience}
Tone: ${tone}

Provide:
1. SHORT_DESCRIPTION: 2-3 sentences (max 150 chars)
2. LONG_DESCRIPTION: 3-5 paragraphs covering features, benefits, use cases
3. TECHNICAL_DESCRIPTION: Detailed technical specifications in paragraph form
4. MARKETING_COPY: Compelling marketing blurb (max 200 chars)
5. BULLET_FEATURES: 5-8 key features as bullet points

Format as JSON with keys: shortDescription, longDescription, technicalDescription, marketingCopy, bulletFeatures`;
  }

  seo(productName: string, category: string, brand: string, shortDescription: string, targetKeyword: string, additionalKeywords: string[]): string {
    return `Generate SEO metadata for "${productName}" (Category: ${category}, Brand: ${brand}).

Short Description: ${shortDescription}
Target Keyword: ${targetKeyword}
Additional Keywords: ${additionalKeywords.join(', ')}

Provide:
1. SEO_TITLE: Title tag (50-60 chars, include keyword)
2. SEO_DESCRIPTION: Meta description (150-160 chars)
3. KEYWORDS: 10-15 relevant keywords as array
4. SLUG: URL-friendly slug
5. META_TAGS: JSON-LD schema-ready fields (name, description, brand, category)

Format as JSON with keys: seoTitle, seoDescription, keywords, slug, metaTags`;
  }

  translate(name: string, shortDescription: string, description: string, targetLocale: string): string {
    const localeNames: Record<string, string> = { en: 'English', hi: 'Hindi', ar: 'Arabic', fr: 'French', es: 'Spanish', de: 'German', zh: 'Chinese' };
    return `Translate the following product content to ${localeNames[targetLocale] || targetLocale} (locale code: ${targetLocale}).

Product Name: ${name}
Short Description: ${shortDescription}
Description: ${description}

Provide translated:
1. name: Product name in target language
2. shortDescription: Short description (keep under 150 chars)
3. description: Full description

Format as JSON with keys: name, shortDescription, description. Keep all HTML tags intact.`;
  }

  specs(productName: string, category: string, brand: string, attributes: Array<{ key: string; value: string }>): string {
    return `Suggest additional product specifications for "${productName}" (Category: ${category}, Brand: ${brand}).

Current specifications: ${attributes.map(a => `${a.key}: ${a.value}`).join(', ')}

Based on the category "${category}", suggest 5-10 common specifications that this product is likely to have but are not yet filled. For each suggestion:
1. key: Specification name
2. value: Likely value based on product name and brand
3. confidence: "high", "medium", or "low"

Only suggest specs that are relevant. Do NOT suggest specs already present.

Format as JSON with keys: suggestions (array of {key, value, confidence}).`;
  }

  images(productName: string, category: string, brand: string, existingImages: number): string {
    return `Suggest image types for product "${productName}" (Category: ${category}, Brand: ${brand}). Current images: ${existingImages}.

Based on the category "${category}", suggest image types that would improve the product listing. For each:
1. type: Image type (e.g., "hero", "lifestyle", "packaging", "detail", "infographic", "compliance")
2. description: What the image should show
3. priority: "essential", "recommended", "optional"
4. reason: Why this image helps

Format as JSON with keys: suggestions (array of {type, description, priority, reason}).`;
  }

  qualityCriteria(): string {
    return `You are a product catalog quality evaluator. Score each criterion 0-100.

Scoring rules:
- titleQuality: Does the product name include brand, model, and key attributes? 
- descriptionQuality: Is there a detailed description (200+ chars)?
- imageQuality: Based on image count and completeness
- specificationQuality: Are technical specs provided?
- seoQuality: Are metaTitle, metaDescription filled? Is metaTitle 50-60 chars?
- categoryQuality: Is category assigned? Is it specific (not root level)?
- brandQuality: Is brand specified?
- attributeQuality: Are product attributes filled?
- completeness: Overall completeness based on all fields

For each criterion under 70, provide a recommendation string.

Format as JSON with keys: scores (object with all 9 criteria 0-100), total (average), recommendations (string array).`;
  }

  duplicates(productName: string, brand: string, category: string, similarProducts: Array<{ name: string; brand: string; sku: string; id: string }>): string {
    return `Analyze potential duplicates for product "${productName}" (Brand: ${brand}, Category: ${category}).

Similar products found: ${similarProducts.map(p => `"${p.name}" (${p.brand}, SKU: ${p.sku})`).join('; ')}

For each similar product, determine:
1. isDuplicate: boolean - is this likely a duplicate?
2. confidence: "high", "medium", "low"
3. reason: Brief explanation
4. suggestedAction: "merge", "keep_both", "review"

Format as JSON with keys: results (array of {productId, productName, isDuplicate, confidence, reason, suggestedAction}).`;
  }
}
