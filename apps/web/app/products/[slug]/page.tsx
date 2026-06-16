import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getProduct, getProductReviews, getProductQuestions, getRelatedProducts } from '@/lib/api/products';
import { ImageGallery } from '@/components/product/image-gallery';
import { Specifications } from '@/components/product/specifications';
import { VariantSelector } from '@/components/product/variant-selector';
import { ReviewsSection } from '@/components/product/reviews-section';
import { QaSection } from '@/components/product/qa-section';
import { SellerCard } from '@/components/product/seller-card';
import { BadgesBar } from '@/components/product/badges-bar';
import { ActionButtons } from '@/components/product/action-buttons';
import { RelatedProducts } from '@/components/product/related-products';
import { FrequentlyBought } from '@/components/product/frequently-bought';
import { ProductSkeleton } from '@/components/product/product-skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CTABlock } from '@/components/shared/cta-block';
import { IndianRupee, MapPin, Shield, Truck, Gauge } from 'lucide-react';
import type { ProductCardData } from '@/components/product/product-card';

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
      _id: p.company?.id || '',
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

  const images = product.media?.filter(m => m.type === 'IMAGE') || [];
  const documents = product.media?.filter(m => m.type === 'DOCUMENT') || [];
  const stockStatus = product.inventory?.stockStatus || 'OUT_OF_STOCK';
  const inStock = stockStatus === 'IN_STOCK' || stockStatus === 'LOW_STOCK';
  const lowestPrice = product.priceSlabs?.length ? Math.min(...product.priceSlabs.map(s => s.price)) : undefined;

  const jsonLd = {
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/products" className="hover:text-primary-600 dark:hover:text-primary-400">Products</Link>
            <ChevronRight className="h-4 w-4" />
            {product.category && (
              <>
                <Link href={`/categories/${product.category.slug}`} className="hover:text-primary-600 dark:hover:text-primary-400">{product.category.name}</Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-text-primary dark:text-dark-text-primary">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container-main">
          <div className="grid gap-8 lg:grid-cols-2 xl:gap-12">
            <div>
              <ImageGallery
                media={product.media || []}
                productName={product.name}
              />
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary lg:text-4xl">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                    by <span className="font-medium text-text-primary dark:text-dark-text-primary">{product.brand}</span>
                    {product.model && <> | Model: {product.model}</>}
                  </p>
                )}
                {product.sku && (
                  <p className="mt-1 text-xs text-text-tertiary">SKU: {product.sku}</p>
                )}
              </div>

              <BadgesBar
                product={{
                  goCashEligible: product.goCashEligible,
                  tradgoEligible: product.tradgoEligible,
                  escrowEligible: product.escrowEligible,
                  isSampleOrder: product.isSampleOrder,
                  exportSupported: product.exportSupported,
                  latitude: product.latitude,
                  longitude: product.longitude,
                }}
              />

              <div className="flex items-baseline gap-3">
                {lowestPrice ? (
                  <>
                    <IndianRupee className="h-7 w-7 text-text-primary dark:text-dark-text-primary" />
                    <span className="text-4xl font-bold text-text-primary dark:text-dark-text-primary">
                      {lowestPrice.toLocaleString('en-IN')}
                    </span>
                    {product.priceSlabs?.length > 1 && (
                      <span className="text-lg text-text-secondary dark:text-dark-text-secondary">
                        - {Math.max(...product.priceSlabs.map(s => s.price)).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-text-secondary dark:text-dark-text-secondary">/{product.unit || 'unit'}</span>
                  </>
                ) : (
                  <span className="text-2xl font-semibold text-text-secondary dark:text-dark-text-secondary">Price on Request</span>
                )}
              </div>

              {product.priceSlabs && product.priceSlabs.length > 1 && (
                <div className="rounded-lg border border-border bg-surface-secondary p-3 dark:bg-dark-surface-secondary dark:border-dark-border">
                  <p className="mb-2 text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase">Bulk Pricing</p>
                  <div className="space-y-1">
                    {product.priceSlabs.map((slab) => (
                      <div key={slab.id} className="flex justify-between text-sm">
                        <span className="text-text-secondary dark:text-dark-text-secondary">
                          {slab.minQty}{slab.maxQty ? ` - ${slab.maxQty}` : '+'} {product.unit}
                        </span>
                        <span className="font-medium text-text-primary dark:text-dark-text-primary">
                          <IndianRupee className="inline h-3 w-3" />{slab.price.toLocaleString('en-IN')}/{product.unit || 'unit'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Badge variant={inStock ? 'success' : 'destructive'}>
                  {inStock ? (stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                </Badge>
                {product.moq > 0 && (
                  <Badge variant="secondary">MOQ: {product.moq} {product.unit || 'units'}</Badge>
                )}
                {product.isFeatured && <Badge variant="warning">Featured</Badge>}
                {product.productType && <Badge variant="outline">{product.productType.replace(/_/g, ' ')}</Badge>}
              </div>

              {product.shortDescription && (
                <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {product.specifications && product.specifications.length > 0 && (
                <div className="rounded-lg border border-border bg-surface p-4 dark:bg-dark-surface dark:border-dark-border">
                  <Specifications specifications={product.specifications} />
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <VariantSelector
                  variants={product.variants.filter(v => v.isActive)}
                  onSelect={() => {}}
                  selectedVariant={null}
                />
              )}

              <ActionButtons
                quantity={1}
                onQuantityChange={() => {}}
                onRFQ={() => {}}
                onChat={() => {}}
                onWishlist={() => {}}
                onCompare={() => {}}
                onBuy={() => {}}
                attachments={documents.map(d => ({ id: d.id, url: d.url, title: d.title }))}
              />

              {product.latitude && product.longitude && (
                <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  <span>Near Me — Far™: <span className="font-medium text-text-primary dark:text-dark-text-primary">Available in your region</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {product.description && (
        <section className="py-12">
          <div className="container-main">
            <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-dark-text-primary">Description</h2>
            <div className="prose prose-gray max-w-3xl dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
          </div>
        </section>
      )}

      {product.specifications && product.specifications.length > 0 && (
        <section className="border-t border-border py-12 dark:border-dark-border">
          <div className="container-main">
            <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-dark-text-primary">Specifications</h2>
            <div className="max-w-2xl">
              <Specifications specifications={product.specifications} />
            </div>
          </div>
        </section>
      )}

      {reviews && (
        <section className="border-t border-border py-12 dark:border-dark-border">
          <div className="container-main">
            <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-dark-text-primary">Reviews & Ratings</h2>
            <ReviewsSection
                reviews={reviews.data}
                stats={{ average: reviews.average, total: reviews.total, breakdown: reviews.breakdown as { 5: number; 4: number; 3: number; 2: number; 1: number } }}
                productSlug={slug}
              />
          </div>
        </section>
      )}

      {questions && (
        <section className="border-t border-border py-12 dark:border-dark-border">
          <div className="container-main">
            <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-dark-text-primary">Questions & Answers</h2>
            <div className="max-w-2xl">
              <QaSection
                questions={questions.data}
                productSlug={slug}
              />
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border py-12 dark:border-dark-border">
        <div className="container-main">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Seller Information</h2>
              <SellerCard
                seller={{
                  id: product.company?.id || '',
                  name: product.company?.name || 'Unknown Seller',
                  slug: product.company?.slug || '',
                  logo: product.company?.logo,
                  businessType: product.company?.businessType,
                  trustScore: product.company?.trustScore || 0,
                  verificationLevel: product.company?.verificationLevel || 'LEVEL_0',
                  city: product.company?.city,
                  state: product.company?.state,
                  responseRate: product.company?.responseRate,
                  createdAt: product.company?.createdAt || product.createdAt,
                }}
              />
            </div>
            <div>
              <div className="sticky top-24 space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Trade Assurance</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Shield className="h-5 w-5 text-accent-500" />
                        <div>
                          <p className="font-medium text-text-primary dark:text-dark-text-primary">Escrow Protection</p>
                          <p className="text-xs text-text-secondary">Secure payments via escrow</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Truck className="h-5 w-5 text-primary-500" />
                        <div>
                          <p className="font-medium text-text-primary dark:text-dark-text-primary">TRADGO Shipping</p>
                          <p className="text-xs text-text-secondary">Pan-India logistics network</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Gauge className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-text-primary dark:text-dark-text-primary">Trust Score</p>
                          <p className="text-xs text-text-secondary">{product.company?.trustScore || 'N/A'}/100</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {product.priceSlabs && product.priceSlabs.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="mb-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Quantity Discounts</h3>
                      <div className="space-y-2">
                        {product.priceSlabs.map((slab) => (
                          <div key={slab.id} className="flex justify-between text-sm">
                            <span className="text-text-secondary">{slab.minQty}{slab.maxQty ? `-${slab.maxQty}` : '+'} {product.unit}</span>
                            <span className="font-medium text-text-primary">
                              <IndianRupee className="inline h-3 w-3" />{slab.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-12 dark:border-dark-border">
        <div className="container-main">
          <RelatedProducts
            products={related}
            title="Similar Products"
            viewAllHref={`/categories/${product.category?.slug || ''}`}
          />
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          <FrequentlyBought products={[]} />
        </div>
      </section>

      <CTABlock
        title="Interested in this product?"
        subtitle="Get competitive quotes from multiple sellers instantly."
        primaryLabel="Post an RFQ"
        primaryHref="/rfq"
        secondaryLabel="Browse More Products"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
