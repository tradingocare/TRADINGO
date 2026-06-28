import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, IndianRupee, MapPin, Shield, Truck, Gauge } from 'lucide-react';
import { getProduct, getProductReviews, getProductQuestions, getRelatedProducts } from '@/lib/api/products';
import { ImageGallery } from '@/components/product/image-gallery';
import { Specifications } from '@/components/product/specifications';
import { VariantSelector } from '@/components/product/variant-selector';
import { ReviewsSection } from '@/components/product/reviews-section';
import { QaSection } from '@/components/product/qa-section';
import { BadgesBar } from '@/components/product/badges-bar';
import { ActionButtons } from '@/components/product/action-buttons';
import { RelatedProducts } from '@/components/product/related-products';
import { FrequentlyBought } from '@/components/product/frequently-bought';
import { ProductSkeleton } from '@/components/product/product-skeleton';
import { SpecificationTabs } from '@/components/product-attributes/specification-tabs';
import SellerBadge, { resolveSellerInfo } from '@/components/shared/SellerBadge';
import ClaimYourGrowth from '@/components/sections/ClaimYourGrowth';
import type { ProductCardData } from '@/components/product/product-card';
import type { ProductAttributesDisplay } from '@/types/product-detail';

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

  const images = product.media?.filter(m => m.type === 'IMAGE') || [];
  const documents = product.media?.filter(m => m.type === 'DOCUMENT') || [];
  const stockStatus = product.inventory?.stockStatus || 'OUT_OF_STOCK';
  const inStock = stockStatus === 'IN_STOCK' || stockStatus === 'LOW_STOCK';
  const lowestPrice = product.priceSlabs?.length ? Math.min(...product.priceSlabs.map(s => s.price)) : undefined;

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
          style={{ background: 'radial-gradient(circle, #FF4D00, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] opacity-10 rounded-full"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10">
        <section className="pt-24 pb-6">
          <div className="mx-auto max-w-7xl px-4">
            <nav className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Link href="/products" className="text-white/50 hover:text-[#FF4D00] transition-colors">Products</Link>
              <ChevronRight size={12} className="text-white/20" />
              {product.category && (
                <><Link href={`/categories/${product.category.slug}`} className="text-white/50 hover:text-[#FF4D00] transition-colors">{product.category.name}</Link>
                <ChevronRight size={12} className="text-white/20" /></>
              )}
              <span className="text-white/80 font-medium">{product.name}</span>
            </nav>
          </div>
        </section>

        <section className="py-4 lg:py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 lg:grid-cols-2 xl:gap-12">
              <div>
                <ImageGallery
                  media={product.media || []}
                  productName={product.name}
                />
              </div>

              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-black text-white lg:text-4xl leading-tight">
                    {product.name}
                  </h1>
                  {product.brand && (
                    <p className="mt-1 text-sm text-white/40">
                      by <span className="font-semibold text-white/70">{product.brand}</span>
                      {product.model && <> | Model: {product.model}</>}
                    </p>
                  )}
                  {product.sku && (
                    <p className="mt-1 text-[10px] text-white/30">SKU: {product.sku}</p>
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

                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div className="flex items-baseline gap-3">
                    {lowestPrice ? (
                      <>
                        <IndianRupee size={28} style={{ color: '#FF4D00' }} />
                        <span className="text-4xl font-black text-white">
                          {lowestPrice.toLocaleString('en-IN')}
                        </span>
                        {product.priceSlabs?.length > 1 && (
                          <span className="text-lg text-white/40">
                            - {Math.max(...product.priceSlabs.map(s => s.price)).toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-white/40">/{product.unit || 'unit'}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-semibold text-white/50">Price on Request</span>
                    )}
                  </div>

                  {product.priceSlabs && product.priceSlabs.length > 1 && (
                    <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Bulk Pricing</p>
                      <div className="space-y-1.5">
                        {product.priceSlabs.map((slab) => (
                          <div key={slab.id} className="flex justify-between text-sm">
                            <span className="text-white/50">{slab.minQty}{slab.maxQty ? ` - ${slab.maxQty}` : '+'} {product.unit}</span>
                            <span className="font-bold text-white"><IndianRupee size={10} className="inline" />{slab.price.toLocaleString('en-IN')}/{product.unit || 'unit'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const pill = 'flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-full';
                    return <>
                      <span className={pill}
                        style={{
                          background: inStock ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                          border: `1px solid ${inStock ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
                          color: inStock ? '#4ade80' : '#f87171',
                        }}>
                        {inStock ? (stockStatus === 'LOW_STOCK' ? '\uD83D\uDFE1' : '\uD83D\uDFE2') : '\uD83D\uDD34'} {inStock ? (stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                      </span>
                      {product.moq > 0 && (
                        <span className={pill} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                          MOQ: {product.moq} {product.unit || 'units'}
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className={pill} style={{ background: 'rgba(242,201,76,0.12)', border: '1px solid rgba(242,201,76,0.3)', color: '#F2C94C' }}>
                          Featured
                        </span>
                      )}
                      {product.productType && (
                        <span className={pill} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                          {product.productType.replace(/_/g, ' ')}
                        </span>
                      )}
                    </>;
                  })()}
                </div>

                {product.shortDescription && (
                  <p className="text-sm leading-relaxed text-white/60">
                    {product.shortDescription}
                  </p>
                )}

                {product.specifications && product.specifications.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <MapPin size={14} style={{ color: '#FF4D00' }} />
                    <span>Near Me - Far: <span className="font-semibold text-white/70">Available in your region</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* -- Description -- */}
        {product.description && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="mb-6 text-2xl font-black text-white">Description</h2>
                <div className="max-w-4xl text-sm leading-relaxed text-white/60" dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          </section>
        )}

        {/* -- Specifications -- */}
        {product.specifications && product.specifications.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="mb-6 text-2xl font-black text-white">Specifications</h2>
                <div className="max-w-2xl">
                  <Specifications specifications={product.specifications} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* -- Detailed Attributes -- */}
        {attrSections.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="mb-6 text-2xl font-black text-white">Detailed Specifications</h2>
                <div className="max-w-3xl">
                  <SpecificationTabs sections={attrSections} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* -- Reviews -- */}
        {reviews && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="mb-6 text-2xl font-black text-white">Reviews & Ratings</h2>
                <ReviewsSection
                  reviews={reviews.data}
                  stats={{ average: reviews.average, total: reviews.total, breakdown: reviews.breakdown as { 5: number; 4: number; 3: number; 2: number; 1: number } }}
                  productSlug={slug}
                />
              </div>
            </div>
          </section>
        )}

        {/* -- Q&A -- */}
        {questions && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="mb-6 text-2xl font-black text-white">Questions & Answers</h2>
                <div className="max-w-2xl">
                  <QaSection questions={questions.data} productSlug={slug} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* -- Seller Information + Trade Assurance -- */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-2xl font-black text-white">Seller Information</h2>
                  <SellerBadge
                    seller={resolveSellerInfo(product)}
                    size="md"
                    showLocation={true}
                    showStats={true}
                    showLogo={true}
                    linkToProfile={true}
                  />
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {product.company?.businessType && (
                        <div><span className="text-white/40">Business Type</span><p className="text-white font-semibold mt-0.5">{product.company.businessType}</p></div>
                      )}
                      {(product as any).company?.gstNumber && (
                        <div><span className="text-white/40">GST</span><p className="text-white font-semibold mt-0.5">{(product as any).company.gstNumber}</p></div>
                      )}
                      {(product as any).company?.totalProducts && (
                        <div><span className="text-white/40">Total Products</span><p className="text-white font-semibold mt-0.5">{(product as any).company.totalProducts}</p></div>
                      )}
                      {product.company?.createdAt && (
                        <div><span className="text-white/40">Member Since</span><p className="text-white font-semibold mt-0.5">{new Date(product.company.createdAt).getFullYear()}</p></div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="sticky top-24 space-y-4">
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <h3 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
                        <Shield size={14} style={{ color: '#FF4D00' }} />
                        Trade Assurance
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
                            <Shield size={16} style={{ color: '#4ade80' }} />
                          </div>
                          <div><p className="text-sm font-semibold text-white">Escrow Protection</p><p className="text-[11px] text-white/40">Secure payments via escrow</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,77,0,0.12)' }}>
                            <Truck size={16} style={{ color: '#FF4D00' }} />
                          </div>
                          <div><p className="text-sm font-semibold text-white">TRADGO Shipping</p><p className="text-[11px] text-white/40">Pan-India logistics network</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(242,201,76,0.12)' }}>
                            <Gauge size={16} style={{ color: '#F2C94C' }} />
                          </div>
                          <div><p className="text-sm font-semibold text-white">Trust Score</p><p className="text-[11px] text-white/40">{product.company?.trustScore || 'N/A'}/100</p></div>
                        </div>
                      </div>
                    </div>

                    {product.priceSlabs && product.priceSlabs.length > 0 && (
                      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <h3 className="mb-3 text-sm font-bold text-white">Quantity Discounts</h3>
                        <div className="space-y-2">
                          {product.priceSlabs.map((slab) => (
                            <div key={slab.id} className="flex justify-between text-sm">
                              <span className="text-white/50">{slab.minQty}{slab.maxQty ? `-${slab.maxQty}` : '+'} {product.unit}</span>
                              <span className="font-bold text-white"><IndianRupee size={10} className="inline" />{slab.price.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- Related Products -- */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <RelatedProducts
              products={related}
              title="Similar Products"
              viewAllHref={`/categories/${product.category?.slug || ''}`}
            />
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <FrequentlyBought products={[]} />
          </div>
        </section>

        <ClaimYourGrowth />
      </div>
    </>
  );
}
