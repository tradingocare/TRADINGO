export interface ProductIndexCatalogItem {
  id: string | null;
  slug: string | null;
  keywords?: string[] | null;
  synonyms?: string[] | null;
  subcategory?: { name: string } | null;
}

export interface ProductIndexEnrichment {
  catalogItemId?: string | null;
  catalogItemSlug?: string | null;
  catalogCategoryPath?: string | null;
  catalogKeywords?: string[];
  catalogSynonyms?: string[];
  subCategoryName?: string | null;
}

export interface ProductIndexInput {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  productType: string;
  status: string;
  brand?: string | null;
  model?: string | null;
  sku?: string | null;
  moq?: number | null;
  unit?: string | null;
  visibilityRadius?: string | null;
  isFeatured: boolean;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
  updatedAt?: Date | null;
  originalPrice?: number | null;
  monthlyOrders?: number | null;
  deliveryEta?: string | null;
  freeDeliveryAbove?: number | null;
  gstInvoiceAvailable?: boolean | null;
  tradeCreditEligible?: boolean | null;
  returnPolicy?: string | null;
  warrantyPeriod?: string | null;
  certifications?: string[] | null;
  company: {
    id: string;
    name: string;
    slug: string;
    trustScore?: number | null;
    verificationLevel?: string | null;
    businessType?: string | null;
    establishedYear?: number | null;
    gstNumber?: string | null;
    certifications?: unknown;
    locations?: { city?: string | null; state?: string | null; country?: string | null; isPrimary?: boolean }[];
  };
  category?: { id?: string | null; name?: string | null } | null;
  industry?: { id?: string | null; name?: string | null } | null;
  inventory?: { availableQuantity?: number | null; stockStatus?: string | null } | null;
  media?: { url: string; type?: string | null; sortOrder?: number | null }[];
  specifications?: { key: string; value: string }[];
  priceSlabs?: { minQty: number; maxQty?: number | null; price: number; currency?: string | null }[];
  catalogItem?: ProductIndexCatalogItem | null;
  enrichment?: ProductIndexEnrichment;
}

export function normalizeCompanyCertifications(certs: unknown): string[] {
  if (!certs) return [];
  if (Array.isArray(certs)) {
    return certs
      .map((c: unknown) => (typeof c === 'string' ? c : (c as { type?: string; name?: string })?.type || (c as { name?: string })?.name || ''))
      .map((c) => String(c).trim())
      .filter(Boolean);
  }
  if (typeof certs === 'object') {
    return Object.entries(certs as Record<string, unknown>)
      .filter(([, v]) => !!v)
      .map(([k]) => k);
  }
  return [];
}

export function buildProductIndexDoc(p: ProductIndexInput): Record<string, unknown> {
  const location = p.company.locations
    ? p.company.locations.find((l) => l.isPrimary) || p.company.locations[0] || {}
    : {};
  const media = [...(p.media || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const slabs = [...(p.priceSlabs || [])].sort((a, b) => a.minQty - b.minQty);
  const minPrice = slabs.length > 0 ? Number(slabs[0].price) : null;
  const maxPrice = slabs.length > 0 ? Number(slabs[slabs.length - 1].price) : null;
  const subCategory =
    p.catalogItem?.subcategory?.name || p.enrichment?.subCategoryName || null;
  const catalogItemId = p.catalogItem?.id || p.enrichment?.catalogItemId || null;
  const catalogItemSlug = p.catalogItem?.slug || p.enrichment?.catalogItemSlug || null;
  const companyCertifications = normalizeCompanyCertifications(p.company?.certifications);
  const companyIsoCertified = companyCertifications.some((cert) =>
    String(cert || '').toUpperCase().includes('ISO'));
  const companyYearsActive = p.company?.establishedYear
    ? Math.max(0, new Date().getFullYear() - p.company.establishedYear)
    : null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription || null,
    description: p.description || null,
    productType: p.productType,
    status: p.status,
    brand: p.brand || null,
    model: p.model || null,
    sku: p.sku || null,
    moq: p.moq ?? null,
    unit: p.unit || null,
    priceUnit: p.unit || null,
    visibilityRadius: p.visibilityRadius || null,
    isFeatured: p.isFeatured,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : p.createdAt.toISOString(),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
    monthlyOrders: p.monthlyOrders ?? null,
    deliveryEta: p.deliveryEta || null,
    freeDeliveryAbove: p.freeDeliveryAbove != null ? Number(p.freeDeliveryAbove) : null,
    gstInvoiceAvailable: p.gstInvoiceAvailable ?? null,
    tradeCreditEligible: p.tradeCreditEligible ?? null,
    returnPolicy: p.returnPolicy || null,
    warrantyPeriod: p.warrantyPeriod ? `${p.warrantyPeriod} months` : null,
    certifications: p.certifications || [],
    companyId: p.company.id,
    companyName: p.company.name,
    companySlug: p.company.slug,
    trustScoreSnapshot: p.company.trustScore ?? 0,
    verificationLevel: p.company.verificationLevel || 'LEVEL_0',
    businessType: p.company.businessType || null,
    companyYearsActive: companyYearsActive,
    companyGstRegistered: !!(p.company.gstNumber || p.gstInvoiceAvailable),
    companyIsoCertified,
    categoryId: p.category?.id || null,
    categoryName: p.category?.name || null,
    industryId: p.industry?.id || null,
    industryName: p.industry?.name || null,
    city: location.city || null,
    state: location.state || null,
    country: location.country || null,
    thumbnail: media[0]?.url || null,
    media: media.map((m) => ({ url: m.url, type: m.type || 'IMAGE' })),
    specifications: (p.specifications || []).map((s) => ({ key: s.key, label: s.key, value: s.value })),
    inventoryStatus: p.inventory?.stockStatus || 'OUT_OF_STOCK',
    availableQuantity: p.inventory?.availableQuantity || 0,
    minPrice,
    maxPrice,
    priceSlabs: slabs.map((s) => ({ minQty: s.minQty, maxQty: s.maxQty, price: Number(s.price) })),
    currency: slabs[0]?.currency || 'INR',
    subCategory,
    catalogItemId,
    catalogItemSlug,
    catalogCategoryPath: p.enrichment?.catalogCategoryPath || null,
    catalogKeywords: p.enrichment?.catalogKeywords || [],
    catalogSynonyms: p.enrichment?.catalogSynonyms || [],
    name_suggest: { input: [p.name] },
  };
}
