import { gocashFromPrice } from '@/components/product/product-hero-price';
import type { ProductDetail, ProductAttributeSection, ProductDetailCertification } from '@/types/product-detail';
import type { ProductDetailViewData, ProductDetailViewDocument } from '@/types/product-detail-view';

function formatCompactNumber(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatDate(value?: string | Date | null) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatBytes(value?: number | string | null) {
  if (value == null || value === '') return '';
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const fixed = size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1);
  return `${fixed} ${units[unitIndex]}`;
}

function docTypeFrom(title: string, url: string) {
  const ext = (url.split('.').pop() || '').replace(/[?#].*$/, '').toUpperCase();
  if (ext.length > 0 && ext.length <= 4) return ext;
  return (title.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
}

function hasIsoCertification(certifications: ProductDetailCertification[]) {
  return (certifications || []).some((cert) => String(cert.type || '').toUpperCase().includes('ISO'));
}

export interface ProductDetailViewOptions {
  reviews?: { average: number; total: number } | null;
  specProps?: Record<string, string>;
}

export function toProductDetailView(product: ProductDetail, options: ProductDetailViewOptions = {}): ProductDetailViewData {
  const images = product.media?.filter((m) => m.type === 'IMAGE').map((m) => m.url) || [];
  const documents = product.media?.filter((m) => m.type === 'DOCUMENT') || [];
  const price = product.priceSlabs?.length ? Math.min(...product.priceSlabs.map((s) => Number(s.price))) : 0;
  const mrp = product.originalPrice != null ? Number(product.originalPrice) : undefined;
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : undefined;
  const company = product.company as any;
  const verified = !!(company?.verificationLevel && company.verificationLevel !== 'LEVEL_0');
  const stockStatus = product.inventory?.stockStatus || 'OUT_OF_STOCK';
  const inStock = stockStatus === 'IN_STOCK' || stockStatus === 'LOW_STOCK';
  const locationParts = [company?.city, company?.state].filter(Boolean);
  const reviewAvg = options.reviews?.average ?? 0;
  const reviewTotal = options.reviews?.total ?? 0;

  const specs: ProductDetailViewData['specs'] = [
    ...(product.specifications || []).map((spec) => ({ key: spec.key, label: spec.label || spec.key, value: spec.value })),
    ...Object.entries(options.specProps || {}).map(([label, value]) => ({ key: label, label, value })),
  ];

  const highlights = [
    product.shortDescription,
    product.description ? product.description.split('\n').find(Boolean) : null,
    product.gstInvoiceAvailable ? 'GST invoice available' : null,
    product.tradeCreditEligible ? 'Trade credit eligible' : null,
    product.deliveryEta ? `Lead time: ${product.deliveryEta}` : null,
    product.returnPolicy ? `Returns: ${product.returnPolicy}` : null,
    product.warrantyPeriod ? `Warranty: ${product.warrantyPeriod}` : null,
    inStock ? 'In stock and ready to ship' : 'Available on request',
  ].filter(Boolean).slice(0, 6) as string[];

  const docList: ProductDetailViewDocument[] = documents.map((doc) => ({
    name: doc.title || doc.url.split('/').pop() || 'Document',
    url: doc.url,
    size: formatBytes(doc.fileSize),
    type: docTypeFrom(doc.title || '', doc.url),
  }));

  const buyerCount = reviewTotal || product.savedCount || product.viewCount || 0;

  return {
    id: product.id,
    productId: product.sku || product.id,
    slug: product.slug,
    title: product.name,
    brand: product.brand,
    category: product.category ? { name: product.category.name, slug: product.category.slug } : undefined,
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      ...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []),
      { label: product.name, href: `/products/${product.slug}` },
    ],
    images,
    price,
    mrp,
    discount,
    unit: product.unit,
    moq: product.moq || 1,
    leadTime: product.deliveryEta || 'Contact seller',
    stock: {
      inStock,
      statusLabel: inStock ? (stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      quantity: product.inventory?.availableQuantity,
    },
    seller: {
      id: company?.id,
      name: company?.name || 'Verified Supplier',
      slug: company?.slug,
      logo: company?.logo,
      website: company?.website || undefined,
      location: locationParts.length > 0 ? locationParts.join(', ') : 'Pan India',
      distance: (company as any)?.distanceKm ? `${(company as any).distanceKm} km away` : undefined,
      yearsInBusiness: company?.yearsActive,
      verified,
      elite: company?.isTradgoElite,
      gstVerified: !!(company?.gstNumber || company?.isGstRegistered),
      isoCertified: hasIsoCertification(company?.certifications),
      trustScore: company?.trustScore || product.trustScoreSnapshot || 0,
      responseRate: company?.responseRate,
      productsListed: company?.totalProducts,
    },
    rating: reviewAvg || undefined,
    reviewCount: reviewTotal || undefined,
    gocash: {
      eligible: !!product.goCashEligible,
      earn: product.goCashEligible ? gocashFromPrice(price) : undefined,
    },
    stats: {
      onTimeDelivery: product.deliveryEta || (product.trustScoreSnapshot >= 65 ? 'Verified track record' : 'Contact seller'),
      responseRate: company?.responseRate ? `${Math.round(company.responseRate)}%` : 'Fast replies',
      happyBuyers: `${formatCompactNumber(buyerCount || 0)}+`,
    },
    specs,
    highlights,
    documents: docList,
    listedDate: formatDate(product.createdAt),
    securePayments: !!product.escrowEligible,
    returnPolicy: product.returnPolicy,
    warranty: product.warrantyPeriod,
    freeDeliveryAbove: product.freeDeliveryAbove != null ? Number(product.freeDeliveryAbove) : undefined,
    supportPhone: '+91 78277 28852',
    supportEmail: 'support@tradingo.com',
  };
}
