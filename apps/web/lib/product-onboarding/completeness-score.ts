import type {
  ProductDraft,
  ProductCompletenessScore,
  CompletenessCategory,
} from './types';

interface ScoreBreakdown {
  basicInfo: number;
  specifications: number;
  media: number;
  pricing: number;
  variants: number;
  certifications: number;
  localization: number;
  logistics: number;
}

const MAX_BASIC_INFO = 20;
const MAX_SPECIFICATIONS = 15;
const MAX_MEDIA = 20;
const MAX_PRICING = 20;
const MAX_VARIANTS = 10;
const MAX_CERTIFICATIONS = 10;
const MAX_LOCALIZATION = 5;
const MAX_LOGISTICS = 5;

export function calculateCompleteness(draft: ProductDraft): {
  total: number;
  breakdown: ScoreBreakdown;
} {
  const basicInfo = calculateBasicInfo(draft);
  const specifications = calculateSpecifications(draft);
  const media = calculateMedia(draft);
  const pricing = calculatePricing(draft);
  const variants = calculateVariants(draft);
  const certifications = calculateCertifications(draft);
  const localization = calculateLocalization(draft);
  const logistics = calculateLogistics(draft);

  const breakdown: ScoreBreakdown = {
    basicInfo,
    specifications,
    media,
    pricing,
    variants,
    certifications,
    localization,
    logistics,
  };

  const total = Math.min(
    100,
    basicInfo +
      specifications +
      media +
      pricing +
      variants +
      certifications +
      localization +
      logistics,
  );

  return { total, breakdown };
}

function calculateBasicInfo(draft: ProductDraft): number {
  let score = 0;
  if (draft.name) score += 3;
  if (draft.categoryId) score += 3;
  if (draft.productType) score += 2;
  if (draft.shortDescription) score += 2;
  if (draft.description) score += 3;
  if (draft.brand) score += 1;
  if (draft.model) score += 1;
  if (draft.unit) score += 1;
  if (draft.moq !== undefined && draft.moq !== null) score += 2;
  if (draft.hsCode) score += 1;
  if (draft.gtin) score += 1;
  return Math.min(score, MAX_BASIC_INFO);
}

function calculateSpecifications(draft: ProductDraft): number {
  const specs = draft.draftSpecs || [];
  const score = specs.length * 2;
  return Math.min(score, MAX_SPECIFICATIONS);
}

function calculateMedia(draft: ProductDraft): number {
  const media = draft.draftMedia || [];
  let score = 0;
  const primaryImage = media.find((m) => m.type === 'IMAGE' && m.isPrimary);
  if (primaryImage) score += 8;

  const additionalImages = media.filter(
    (m) => m.type === 'IMAGE' && !m.isPrimary,
  );
  score += Math.min(additionalImages.length, 4) * 1;

  const video = media.find((m) => m.type === 'VIDEO');
  if (video) score += 3;

  const documents = media.filter((m) => m.type === 'DOCUMENT');
  score += Math.min(documents.length, 5) * 1;

  return Math.min(score, MAX_MEDIA);
}

function calculatePricing(draft: ProductDraft): number {
  let score = 0;
  const slabs = draft.priceSlabs || [];

  const hasAnyPrice = slabs.some((s) => s.price > 0) || draft.moq;
  if (hasAnyPrice) score += 5;

  score += Math.min(slabs.length, 3) * 2;

  if (draft.moq !== undefined && draft.moq !== null) score += 2;

  const hasCurrency = slabs.some((s) => s.currency) || true;
  if (hasCurrency) score += 1;

  return Math.min(score, MAX_PRICING);
}

function calculateVariants(draft: ProductDraft): number {
  const variants = draft.draftVariants || [];
  let score = 0;

  const activeVariants = variants.filter((v) => v.isActive);
  if (activeVariants.length > 0) score += 5;

  const variantsWithPrice = activeVariants.filter(
    (v) => v.price !== undefined && v.price > 0,
  );
  score += Math.min(variantsWithPrice.length, 5) * 1;

  return Math.min(score, MAX_VARIANTS);
}

function calculateCertifications(draft: ProductDraft): number {
  const certs = draft.certifications || [];
  const score = certs.length * 3;
  return Math.min(score, MAX_CERTIFICATIONS);
}

function calculateLocalization(draft: ProductDraft): number {
  const langs = draft.multiLangDesc || [];
  const nonPrimary = langs.filter((l) => !l.isPrimary);
  const score = nonPrimary.length * 2;
  return Math.min(score, MAX_LOCALIZATION);
}

function calculateLogistics(draft: ProductDraft): number {
  let score = 0;
  if (draft.exportSupported) score += 2;
  if (draft.isSampleOrder) score += 2;
  if (draft.latitude && draft.longitude) score += 1;
  return Math.min(score, MAX_LOGISTICS);
}

export function getCompletenessLevel(
  score: number,
): 'incomplete' | 'partial' | 'good' | 'excellent' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 40) return 'partial';
  return 'incomplete';
}

export function getCompletenessDetails(
  draft: ProductDraft,
): ProductCompletenessScore {
  const { total, breakdown } = calculateCompleteness(draft);

  return {
    id: '',
    draftId: draft.id,
    total,
    basicInfo: breakdown.basicInfo,
    specifications: breakdown.specifications,
    media: breakdown.media,
    pricing: breakdown.pricing,
    variants: breakdown.variants,
    certifications: breakdown.certifications,
    localization: breakdown.localization,
    logistics: breakdown.logistics,
    lastCalculatedAt: new Date().toISOString(),
  };
}

export function getCategoryBreakdown(
  score: ProductCompletenessScore,
): CompletenessCategory[] {
  return [
    {
      key: 'basicInfo',
      label: 'Basic Information',
      score: score.basicInfo,
      maxScore: MAX_BASIC_INFO,
      items: [
        { label: 'Product Name', filled: score.basicInfo >= 3, field: 'name' },
        { label: 'Category', filled: score.basicInfo >= 6, field: 'categoryId' },
        { label: 'Product Type', filled: score.basicInfo >= 8, field: 'productType' },
        { label: 'Description', filled: score.basicInfo >= 10, field: 'description' },
        { label: 'Brand / Model', filled: score.basicInfo >= 12, field: 'brand' },
        { label: 'Unit & MOQ', filled: score.basicInfo >= 15, field: 'moq' },
        { label: 'HS Code / GTIN', filled: score.basicInfo >= 17, field: 'hsCode' },
      ],
    },
    {
      key: 'specifications',
      label: 'Specifications',
      score: score.specifications,
      maxScore: MAX_SPECIFICATIONS,
      items: [
        { label: 'Technical Specs', filled: score.specifications >= 2, field: 'draftSpecs' },
        { label: 'Detailed Attributes', filled: score.specifications >= 6, field: 'draftSpecs' },
        { label: 'Comprehensive Specs', filled: score.specifications >= 12, field: 'draftSpecs' },
      ],
    },
    {
      key: 'media',
      label: 'Media',
      score: score.media,
      maxScore: MAX_MEDIA,
      items: [
        { label: 'Primary Image', filled: score.media >= 8, field: 'draftMedia' },
        { label: 'Additional Images', filled: score.media >= 12, field: 'draftMedia' },
        { label: 'Video', filled: score.media >= 15, field: 'draftMedia' },
        { label: 'Documents', filled: score.media >= 18, field: 'draftMedia' },
      ],
    },
    {
      key: 'pricing',
      label: 'Pricing',
      score: score.pricing,
      maxScore: MAX_PRICING,
      items: [
        { label: 'Base Price Set', filled: score.pricing >= 5, field: 'priceSlabs' },
        { label: 'Price Slabs', filled: score.pricing >= 11, field: 'priceSlabs' },
        { label: 'MOQ Configured', filled: score.pricing >= 13, field: 'moq' },
        { label: 'Currency Set', filled: score.pricing >= 14, field: 'priceSlabs' },
      ],
    },
    {
      key: 'variants',
      label: 'Variants',
      score: score.variants,
      maxScore: MAX_VARIANTS,
      items: [
        { label: 'Variants Defined', filled: score.variants >= 5, field: 'draftVariants' },
        { label: 'Variant Pricing', filled: score.variants >= 8, field: 'draftVariants' },
      ],
    },
    {
      key: 'certifications',
      label: 'Certifications',
      score: score.certifications,
      maxScore: MAX_CERTIFICATIONS,
      items: [
        { label: 'Certifications Added', filled: score.certifications >= 3, field: 'certifications' },
        { label: 'Multiple Certifications', filled: score.certifications >= 9, field: 'certifications' },
      ],
    },
    {
      key: 'localization',
      label: 'Localization',
      score: score.localization,
      maxScore: MAX_LOCALIZATION,
      items: [
        { label: 'Multi-language Descriptions', filled: score.localization >= 4, field: 'multiLangDesc' },
      ],
    },
    {
      key: 'logistics',
      label: 'Logistics',
      score: score.logistics,
      maxScore: MAX_LOGISTICS,
      items: [
        { label: 'Export Support', filled: score.logistics >= 2, field: 'exportSupported' },
        { label: 'Sample Order', filled: score.logistics >= 4, field: 'isSampleOrder' },
        { label: 'Location', filled: score.logistics >= 5, field: 'location' },
      ],
    },
  ];
}

export function getNextActions(
  draft: ProductDraft,
  score: { total: number; breakdown: ScoreBreakdown },
): string[] {
  const actions: string[] = [];
  const b = score.breakdown;

  if (b.basicInfo < MAX_BASIC_INFO) {
    if (!draft.name) actions.push('Add a product name');
    if (!draft.categoryId) actions.push('Select a product category');
    if (!draft.productType) actions.push('Select product type');
    if (!draft.shortDescription) actions.push('Add a short description');
    if (!draft.description) actions.push('Add a detailed description');
    if (!draft.brand) actions.push('Add brand name');
    if (!draft.model) actions.push('Add model number');
    if (!draft.unit) actions.push('Specify the unit of measurement');
    if (!draft.moq) actions.push('Set minimum order quantity (MOQ)');
    if (!draft.hsCode) actions.push('Add HS Code for customs');
    if (!draft.gtin) actions.push('Add GTIN for product identification');
  }

  if (b.specifications < MAX_SPECIFICATIONS) {
    const needed = Math.ceil((MAX_SPECIFICATIONS - b.specifications) / 2);
    if (needed > 0) {
      actions.push(
        `Add ${needed} more technical specification${needed > 1 ? 's' : ''}`,
      );
    }
  }

  if (b.media < MAX_MEDIA) {
    const mediaList = draft.draftMedia || [];
    if (!mediaList.some((m) => m.type === 'IMAGE' && m.isPrimary)) {
      actions.push('Upload a primary product image');
    }
    const nonPrimaryImages = mediaList.filter(
      (m) => m.type === 'IMAGE' && !m.isPrimary,
    );
    if (nonPrimaryImages.length < 4) {
      const needed = 4 - nonPrimaryImages.length;
      actions.push(`Add ${needed} more product image${needed > 1 ? 's' : ''}`);
    }
    if (!mediaList.some((m) => m.type === 'VIDEO')) {
      actions.push('Add a product video');
    }
  }

  if (b.pricing < MAX_PRICING) {
    const slabs = draft.priceSlabs || [];
    if (slabs.length === 0) {
      actions.push('Set base pricing for the product');
    }
    if (slabs.length < 3) {
      const needed = 3 - slabs.length;
      actions.push(
        `Add ${needed} more price slab${needed > 1 ? 's' : ''} for bulk orders`,
      );
    }
    if (!draft.moq) {
      actions.push('Configure minimum order quantity');
    }
  }

  if (b.variants < MAX_VARIANTS) {
    const active = draft.draftVariants?.filter((v) => v.isActive) || [];
    if (active.length === 0) {
      actions.push('Add product variants (size, color, etc.)');
    } else {
      const noPrice = active.filter(
        (v) => !v.price || v.price <= 0,
      );
      if (noPrice.length > 0) {
        actions.push('Set prices for all variants');
      }
    }
  }

  if (b.certifications < MAX_CERTIFICATIONS) {
    actions.push('Add product certifications to build buyer trust');
  }

  if (b.localization < MAX_LOCALIZATION) {
    actions.push(
      'Add multi-language descriptions to reach wider audience',
    );
  }

  if (b.logistics < MAX_LOGISTICS) {
    if (!draft.exportSupported) {
      actions.push('Configure export support settings');
    }
    if (!draft.isSampleOrder) {
      actions.push('Enable sample ordering');
    }
    if (!draft.latitude || !draft.longitude) {
      actions.push('Set product origin location');
    }
  }

  return actions.slice(0, 5);
}
