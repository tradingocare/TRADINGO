'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { SanitizedHtml } from '@/components/shared/sanitized-html';
import { Specifications } from '@/components/product/specifications';
import { ReviewsSection } from '@/components/product/reviews-section';
import { QaSection } from '@/components/product/qa-section';
import { RelatedProducts } from '@/components/product/related-products';
import { ProductHeroSeller } from '@/components/product/product-hero-seller';
import { VariantSelector } from '@/components/product/variant-selector';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCompareStore } from '@/store/compare-store';
import { ProductGallery } from '@/components/product-detail-view/gallery';
import { BuyBox } from '@/components/product-detail-view/buy-box';
import { AiTrustGrid, VerifiedBadgeRow } from '@/components/product-detail-view/sections';
import { SpecGrid, DocumentsSection } from '@/components/product-detail-view/spec-grid';
import type { ProductDetailMedia, ProductDetailPriceSlab, ProductDetailSpec, ProductDetailVariant } from '@/types/product-detail';
import type { ProductCardData } from '@/types/product-card';
import type { ProductDetailViewData } from '@/types/product-detail-view';

interface ProductDetailViewProps {
  data: ProductDetailViewData;
  media: ProductDetailMedia[];
  priceSlabs: ProductDetailPriceSlab[];
  variants?: ProductDetailVariant[];
  description?: string;
  fullSpecs?: ProductDetailSpec[];
  reviews?: {
    data: any[];
    average: number;
    total: number;
    breakdown: Record<number, number>;
  } | null;
  questions?: {
    data: any[];
    total: number;
  } | null;
  related?: ProductCardData[];
}

export function ProductDetailView({
  data,
  media,
  priceSlabs,
  variants,
  description,
  fullSpecs,
  reviews,
  questions,
  related,
}: ProductDetailViewProps) {
  const router = useRouter();
  const auth = useAuthStore();
  const wishlist = useWishlistStore();
  const compare = useCompareStore();
  const [quantity, setQuantity] = useState(data.moq || 1);
  const [selectedVariant, setSelectedVariant] = useState<ProductDetailVariant | null>(null);

  useEffect(() => {
    auth.hydrateFromStorage();
    if (auth.isAuthenticated && !wishlist.loaded) wishlist.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, wishlist.loaded]);

  const displayPrice = useMemo(() => {
    if (selectedVariant?.price != null) return Number(selectedVariant.price);
    return data.price;
  }, [selectedVariant, data.price]);

  const isWishlisted = wishlist.isSaved(data.id);
  const isCompared = compare.items.some((item) => item._id === data.id);
  const activeVariants = variants?.filter((variant) => variant.isActive) || [];

  const requireAuth = (action: () => void) => {
    if (!auth.isAuthenticated) {
      router.push('/login');
      return;
    }
    action();
  };

  const handleWishlist = () => requireAuth(() => wishlist.toggle(data.id));

  const handleCompare = () => {
    compare.toggle({
      _id: data.id,
      slug: data.slug,
      title: data.title,
      images: data.images,
      price: data.price,
      unit: data.unit || 'unit',
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      moq: data.moq,
      inStock: data.stock.inStock,
      seller: {
        businessName: data.seller.name,
        slug: data.seller.slug,
        isVerified: data.seller.verified,
        trustScore: data.seller.trustScore || 0,
        city: data.seller.location || '',
      },
      deliveryEta: data.leadTime,
      stockQty: data.stock.quantity,
      gstInvoiceAvailable: data.seller.gstVerified,
      tradeCreditEligible: false,
      returnPolicy: data.returnPolicy,
    });
  };

  const handleBuy = () => requireAuth(() => {
    router.push(`/checkout?productId=${data.id}&qty=${quantity}`);
  });

  const handleRFQ = () => requireAuth(() => {
    router.push(`/buyer/rfq/create?productId=${data.id}`);
  });

  const handleChat = () => requireAuth(() => {
    const vendorId = data.seller.id || data.seller.slug || '';
    router.push(`/messages?vendor=${encodeURIComponent(vendorId)}&product=${data.id}`);
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, url });
      } catch {
        // User cancelled.
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const subtitleParts = [data.category?.name, data.brand ? `Brand: ${data.brand}` : null].filter(Boolean);

  return (
    <section className="pt-24 pb-4">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12">
        <nav className="inline-flex flex-wrap items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-xs backdrop-blur-md" aria-label="Breadcrumb">
          {data.breadcrumb.map((item, index) => {
            const isLast = index === data.breadcrumb.length - 1;
            return (
              <span key={item.href + index} className="inline-flex items-center gap-2">
                {index > 0 && <ChevronRight size={12} className="text-text-tertiary" />}
                {isLast ? (
                  <span className="max-w-[200px] truncate font-semibold text-text-primary">{item.label}</span>
                ) : (
                  <Link href={item.href} className="text-text-secondary transition-colors hover:text-accent">
                    {item.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        <div className="mt-5">
          <h1 className="text-2xl font-black leading-tight text-text-primary lg:text-3xl">{data.title}</h1>
          {subtitleParts.length > 0 && (
            <p className="mt-1.5 text-sm text-text-secondary">
              {data.category?.slug ? (
                <Link href={`/categories/${data.category.slug}`} className="font-semibold text-accent transition-colors hover:underline">
                  {data.category.name}
                </Link>
              ) : (
                data.category?.name
              )}
              {data.brand ? <span className="ml-2 text-text-tertiary">{data.brand}</span> : null}
            </p>
          )}
          <div className="mt-3">
            <VerifiedBadgeRow data={data} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ProductGallery
              media={media}
              productName={data.title}
              discountPct={data.discount || 0}
              isWishlisted={isWishlisted}
              onWishlist={handleWishlist}
            />

            <AiTrustGrid data={data} />

            <SpecGrid data={data} />

            <DocumentsSection data={data} />
          </div>

          <div className="lg:col-span-1">
            {activeVariants.length > 0 && (
              <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
                <VariantSelector
                  variants={activeVariants}
                  selectedVariant={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              </div>
            )}
            <BuyBox
              data={data}
              priceSlabs={priceSlabs}
              price={displayPrice}
              quantity={quantity}
              onQuantityChange={setQuantity}
              isWishlisted={isWishlisted}
              isCompared={isCompared}
              onBuy={handleBuy}
              onRFQ={handleRFQ}
              onChat={handleChat}
              onSave={handleWishlist}
              onCompare={handleCompare}
              onShare={handleShare}
            />
          </div>
        </div>

        {description && (
          <section className="mt-10" id="description">
            <SectionHeading kicker="Overview" title="Product Description" />
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-text-secondary">
              <SanitizedHtml html={description} />
            </div>
          </section>
        )}

        {fullSpecs && fullSpecs.length > 0 && (
          <section className="mt-10" id="specifications">
            <SectionHeading kicker="Details" title="Full Specifications" />
            <div className="rounded-2xl border border-border bg-surface p-6">
              <Specifications specifications={fullSpecs} />
            </div>
          </section>
        )}

        {reviews && reviews.data.length > 0 && (
          <section className="mt-10" id="reviews">
            <SectionHeading kicker="Social Proof" title="Reviews &amp; Ratings" />
            <ReviewsSection
              reviews={reviews.data}
              stats={{
                average: reviews.average,
                total: reviews.total,
                breakdown: {
                  5: reviews.breakdown[5] || 0,
                  4: reviews.breakdown[4] || 0,
                  3: reviews.breakdown[3] || 0,
                  2: reviews.breakdown[2] || 0,
                  1: reviews.breakdown[1] || 0,
                },
              }}
              productSlug={data.slug}
            />
          </section>
        )}

        {questions && questions.data.length > 0 && (
          <section className="mt-10" id="qa">
            <SectionHeading kicker="Community" title="Questions &amp; Answers" />
            <QaSection questions={questions.data} productSlug={data.slug} />
          </section>
        )}

        {data.seller.slug && (
          <section className="mt-10" id="seller">
            <SectionHeading kicker="Supplier" title="Seller Information" />
            <ProductHeroSeller
              company={{
                name: data.seller.name,
                slug: data.seller.slug,
                logo: data.seller.logo,
                responseRate: data.seller.responseRate,
                city: data.seller.location,
                trustScore: data.seller.trustScore,
              }}
              sellerName={data.seller.name}
              sellerSlug={data.seller.slug}
              sellerLogo={data.seller.logo}
              isVerified={data.seller.verified}
              hasGst={!!data.seller.gstVerified}
              trustScore={data.seller.trustScore || 0}
              isTradgoElite={data.seller.elite}
              hasLocation={!!data.seller.location}
              rating={data.rating}
              reviewCount={data.reviewCount}
              responseRate={data.seller.responseRate}
              yearsActive={data.seller.yearsInBusiness}
            />
          </section>
        )}

        {related && related.length > 0 && (
          <section className="mt-10" id="similar">
            <SectionHeading kicker="Explore" title="Similar Products" />
            <RelatedProducts products={related} title="Similar Products" viewAllHref={`/products?category=${data.category?.slug || ''}`} />
          </section>
        )}
      </div>
    </section>
  );
}
