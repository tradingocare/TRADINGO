import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProductReviews, getProductQuestions, getRelatedProducts } from '@/lib/api/products';
import { ProductDetailView } from '@/components/product-detail-view/product-detail-view';
import { toProductDetailView } from '@/lib/mappers/product-detail-view';
import { ProductSkeleton } from '@/components/product/product-skeleton';
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth';
import type { ProductCardData } from '@/types/product-card';
import type { ProductAttributesDisplay, ProductDetailSpec } from '@/types/product-detail';

function toProductCard(p: Record<string, any>): ProductCardData {
  const images = p.media?.filter((m: any) => m.type === 'IMAGE').map((m: any) => m.url) || [];
  const slab = p.priceSlabs?.[0];
  return {
    _id: p.id || p._id,
    id: p.id,
    slug: p.slug,
    title: p.name,
    images,
    videoUrl: p.videoUrl,
    categoryName: p.category?.name || '',
    subCategory: '',
    sku: p.sku,
    price: slab?.price || p.minPrice || 0,
    originalPrice: p.originalPrice,
    unit: p.unit || '',
    rating: 0,
    reviewCount: 0,
    viewCount: p.viewCount,
    savedCount: p.savedCount,
    monthlyOrders: p.monthlyOrders,
    isBestseller: p.isBestseller,
    priceSlabs: p.priceSlabs?.map((s: any) => ({ minQty: s.minQty, maxQty: s.maxQty ?? null, price: s.price })),
    seller: {
      id: p.company?.id || '',
      _id: p.company?.id || '',
      slug: p.company?.slug || '',
      businessName: p.company?.name || (p as any).companyName || '',
      isVerified: (p.company?.verificationLevel && p.company.verificationLevel !== 'LEVEL_0') || false,
      isTradgoElite: (p as any).isTradgoElite,
      trustScore: p.company?.trustScore || p.trustScoreSnapshot || 0,
      avgResponseTime: p.company?.responseTime || p.company?.avgResponseTime,
      yearsActive: (p as any).yearsActive,
      ordersFulfilled: (p as any).ordersFulfilled,
      city: p.company?.locations?.[0]?.city || (p as any).city || '',
      distanceKm: (p as any).distanceKm,
      isGstRegistered: !!(p.company?.gstNumber || (p as any).gstInvoiceAvailable),
    },
    moq: p.moq || 0,
    maxOrderQty: p.maxOrderQty,
    deliveryEta: p.deliveryEta,
    freeDeliveryAbove: p.freeDeliveryAbove,
    stockQty: p.inventory?.availableQuantity,
    inStock: p.inventory?.stockStatus === 'IN_STOCK' || p.inventory?.stockStatus === 'LOW_STOCK',
    specifications: p.specifications?.map((s: any) => ({ key: s.key, label: s.label || '', value: s.value })),
    gstInvoiceAvailable: p.gstInvoiceAvailable,
    tradeCreditEligible: p.tradeCreditEligible,
    returnPolicy: p.returnPolicy,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: product.shortDescription || product.description?.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description?.slice(0, 160),
        images: product.media?.filter(m => m.type === 'IMAGE').map(m => m.url),
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export function generateStaticParams() {
  return [];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail slug={slug} />
    </Suspense>
  );
}

async function ProductDetail({ slug }: { slug: string }) {
  let product: Awaited<ReturnType<typeof getProduct>>;
  let reviews: Awaited<ReturnType<typeof getProductReviews>> | null = null;
  let questions: Awaited<ReturnType<typeof getProductQuestions>> | null = null;
  let related: ProductCardData[] = [];

  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  try {
    reviews = await getProductReviews(slug);
  } catch { /* reviews unavailable */ }

  try {
    questions = await getProductQuestions(slug);
  } catch { /* q&a unavailable */ }

  try {
    const raw = await getRelatedProducts(slug);
    related = Array.isArray(raw) ? raw.map(toProductCard) : [];
  } catch { /* related unavailable */ }

  const productAttributes = product.productAttributes as ProductAttributesDisplay | undefined;
  const attrSections = productAttributes?.sections || [];

  const specProps: Record<string, string> = {};
  for (const section of attrSections) {
    for (const field of section.fields) {
      if (field.displayValue !== null && field.displayValue !== undefined && field.displayValue !== '') {
        specProps[field.label] = String(field.displayValue);
      }
    }
  }

  const images = product.media?.filter(m => m.type === 'IMAGE') || [];
  const lowestPrice = product.priceSlabs?.length ? Math.min(...product.priceSlabs.map(s => s.price)) : undefined;
  const inStock = (product.inventory?.stockStatus === 'IN_STOCK' || product.inventory?.stockStatus === 'LOW_STOCK');

  const fullSpecs: ProductDetailSpec[] = [
    ...(product.specifications || []),
    ...Object.entries(specProps).map(([label, value], index) => ({
      id: `attr-${index}`,
      key: label,
      label,
      value,
    })),
  ];

  const viewData = toProductDetailView(product, {
    reviews: reviews ? { average: reviews.average, total: reviews.total } : null,
    specProps,
  });

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku || product.id,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: images[0]?.url,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: lowestPrice,
      highPrice: product.priceSlabs?.length ? Math.max(...product.priceSlabs.map(s => s.price)) : lowestPrice,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  if (Object.keys(specProps).length > 0) {
    jsonLd.additionalProperty = Object.entries(specProps).map(([name, value]) => ({
      '@type': 'PropertyValue',
      name,
      value,
    }));
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] opacity-15 rounded-full"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10">
        <ProductDetailView
          data={viewData}
          media={product.media || []}
          priceSlabs={product.priceSlabs || []}
          variants={product.variants || []}
          description={product.description || product.shortDescription || ''}
          fullSpecs={fullSpecs}
          reviews={reviews}
          questions={questions}
          related={related}
        />
        <ClaimYourGrowth />
      </div>
    </>
  );
}
