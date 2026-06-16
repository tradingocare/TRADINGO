'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useCompareStore } from '@/store/compare-store';
import { useWishlistStore } from '@/store/wishlist-store';
import {
  Star, Eye, Bookmark, TrendingUp, Coins, ShieldCheck, Crown, Zap,
  CalendarClock, Package, MapPin, Lock, FileText, Truck, Gift,
  CheckCircle2, Wallet, CreditCard, RotateCcw, ShoppingCart,
  MessageCircle, FileQuestion, ArrowLeftRight, Share2, Flame,
  PlayCircle, ChevronLeft, ChevronRight, Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ProductCardData {
  _id: string;
  id?: string;
  slug: string;
  title: string;
  images: string[];
  videoUrl?: string;
  categoryName: string;
  subCategory: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  rating: number;
  reviewCount: number;
  viewCount?: number;
  savedCount?: number;
  monthlyOrders?: number;
  isBestseller?: boolean;
  priceSlabs?: { minQty: number; maxQty: number | null; price: number }[];
  seller: {
    _id: string;
    businessName: string;
    isVerified: boolean;
    isTradgoElite?: boolean;
    trustScore: number;
    avgResponseTime?: string;
    yearsActive?: number;
    ordersFulfilled?: number;
    city: string;
    distanceKm?: number;
    isGstRegistered?: boolean;
  };
  moq: number;
  maxOrderQty?: number;
  deliveryEta?: string;
  freeDeliveryAbove?: number;
  stockQty?: number;
  inStock: boolean;
  specifications?: { key: string; label: string; value: string }[];
  gstInvoiceAvailable?: boolean;
  tradeCreditEligible?: boolean;
  returnPolicy?: string;
}

function gocashEarn(price: number) {
  return Math.floor(price / 1000) * 100;
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const [imgIdx, setImgIdx] = useState(0);
  const router = useRouter();
  const { user } = useAuthStore();
  const { items: compareItems, toggle: toggleCompare } = useCompareStore();
  const { ids: wishIds, loaded, fetch: fetchWishlist, toggle: toggleWishlist } = useWishlistStore();

  useEffect(() => {
    if (user?.role === 'BUYER' && !loaded) fetchWishlist();
  }, [user, loaded, fetchWishlist]);

  const pid = (product as any)._id || product.id!;
  const inCompare = compareItems.some(i => i._id === pid);
  const isSaved = wishIds.includes(pid);
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const images = product.images?.length ? product.images : ['/placeholder-product.jpg'];
  const earn = gocashEarn(product.price);

  const requireAuth = (fn: () => void) => {
    if (!user) {
      toast({ title: 'Login karke continue karein', variant: 'destructive' });
      router.push('/login');
      return;
    }
    fn();
  };

  const handleChat = () => requireAuth(() => {
    router.push(`/messages?vendor=${product.seller._id}&product=${pid}`);
  });

  const handleRFQ = () => requireAuth(() => {
    router.push(`/buyer/rfq/create?productId=${pid}`);
  });

  const handleBuyNow = () => requireAuth(() => {
    router.push(`/checkout?productId=${pid}&qty=${product.moq}`);
  });

  const handleSave = () => requireAuth(async () => {
    if (user?.role !== 'BUYER') {
      toast({ title: 'Sirf buyer account se save kar sakte hain', variant: 'destructive' });
      return;
    }
    try {
      await toggleWishlist(pid);
      toast({ title: isSaved ? 'Wishlist se hata diya' : 'Wishlist mein add ho gaya' });
    } catch {
      toast({ title: 'Kuch error aaya, phir try karein', variant: 'destructive' });
    }
  });

  const handleCompare = () => {
    if (!inCompare && compareItems.length >= 4) {
      toast({ title: 'Maximum 4 products compare kar sakte hain', variant: 'destructive' });
      return;
    }
    toggleCompare(product);
    toast({ title: inCompare ? 'Compare se hata diya' : 'Compare list mein add ho gaya' });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${product.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: product.title, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copy ho gaya!' });
    }
  };

  return (
    <div className={cn(
      'flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:shadow-md',
      'dark:border-dark-border dark:bg-dark-surface'
    )}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary dark:bg-dark-surface-secondary">
        <img
          src={images[imgIdx]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {product.isBestseller && (
            <Badge variant="warning" className="flex items-center gap-1 text-[10px]">
              <Flame size={11} /> Bestseller
            </Badge>
          )}
          {discountPct > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {discountPct}% OFF
            </Badge>
          )}
        </div>

        <button onClick={handleSave} aria-label="Save to wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur transition-all hover:bg-black/60">
          <Bookmark size={15} className={cn(isSaved ? 'fill-amber-500 text-amber-500' : 'text-white')} />
        </button>

        {product.videoUrl && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur">
            <PlayCircle size={11} /> Video
          </span>
        )}

        {images.length > 1 && (
          <>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur">
              {imgIdx + 1}/{images.length}
            </span>
            <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[10px] text-text-tertiary dark:text-dark-text-tertiary">
          {product.categoryName} › {product.subCategory}
        </p>

        <Link href={`/product/${product.slug}`}>
          <h3 className="mb-1 line-clamp-2 text-sm font-bold text-text-primary transition-colors hover:text-primary-600 dark:text-dark-text-primary dark:hover:text-primary-400">
            {product.title}
          </h3>
        </Link>
        {product.sku && (
          <p className="mb-2 text-[10px] text-text-tertiary dark:text-dark-text-tertiary">SKU {product.sku}</p>
        )}

        {/* Rating row */}
        <div className="mb-1 flex flex-wrap items-center gap-3 text-[11px] text-text-secondary dark:text-dark-text-secondary">
          <span className="flex items-center gap-1 font-semibold text-text-primary dark:text-dark-text-primary">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            {product.rating.toFixed(1)}
            <span className="font-normal text-text-tertiary dark:text-dark-text-tertiary">({product.reviewCount})</span>
          </span>
          {!!product.viewCount && (
            <span className="flex items-center gap-1"><Eye size={12} />{product.viewCount}</span>
          )}
          {!!product.savedCount && (
            <span className="flex items-center gap-1"><Bookmark size={12} />{product.savedCount}</span>
          )}
        </div>
        {!!product.monthlyOrders && (
          <p className="mb-2 flex items-center gap-1 text-[11px] text-green-500 dark:text-green-400">
            <TrendingUp size={12} /> {product.monthlyOrders} orders this month
          </p>
        )}

        {/* Price */}
        <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-black text-text-primary dark:text-dark-text-primary">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {discountPct > 0 && (
            <>
              <span className="text-xs text-text-tertiary line-through dark:text-dark-text-tertiary">
                ₹{product.originalPrice!.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-red-500 dark:text-red-400">
                Save ₹{(product.originalPrice! - product.price).toLocaleString('en-IN')}
              </span>
            </>
          )}
        </div>
        <p className="mb-2 text-[10px] text-text-tertiary dark:text-dark-text-tertiary">
          per {product.unit} · inclusive of GST
        </p>

        {earn > 0 && (
          <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <Coins size={11} /> Earn {earn} GOCASH on this order
          </div>
        )}

        {/* Price slabs */}
        {!!product.priceSlabs?.length && (
          <div className="mb-3 grid grid-cols-4 gap-1">
            {product.priceSlabs.slice(0, 4).map((s, i, arr) => (
              <div key={i}
                className={cn(
                  'rounded-lg py-1.5 text-center',
                  i === arr.length - 1
                    ? 'border border-green-500/20 bg-green-500/10'
                    : 'bg-surface-secondary dark:bg-dark-surface-secondary'
                )}>
                <p className="text-[9px] text-text-tertiary dark:text-dark-text-tertiary">
                  {s.minQty}{s.maxQty ? `-${s.maxQty}` : '+'}
                </p>
                <p className={cn(
                  'text-xs font-bold',
                  i === arr.length - 1 ? 'text-green-500 dark:text-green-400' : 'text-text-primary dark:text-dark-text-primary'
                )}>
                  ₹{s.price}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Seller */}
        <div className="mb-3 border-t border-border pt-3 dark:border-dark-border">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-primary-700/30 text-xs font-black text-amber-500">
              {product.seller.businessName[0]?.toUpperCase()}
            </div>
            <p className="flex-1 truncate text-xs font-semibold text-text-primary dark:text-dark-text-primary">
              {product.seller.businessName}
            </p>
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.seller.isVerified && (
              <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-500 dark:text-green-400">
                <ShieldCheck size={10} /> Verified
              </span>
            )}
            {product.seller.isTradgoElite && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                <Crown size={10} /> TRADGO Elite
              </span>
            )}
          </div>

          <div className="mb-2">
            <div className="mb-1 flex justify-between text-[10px] text-text-secondary dark:text-dark-text-secondary">
              <span>Trust score</span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{product.seller.trustScore}/100</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-secondary dark:bg-dark-surface-secondary">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${product.seller.trustScore}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-text-secondary dark:text-dark-text-secondary">
            {product.seller.avgResponseTime && (
              <span className="flex items-center gap-1"><Zap size={11} />{product.seller.avgResponseTime}</span>
            )}
            {product.seller.yearsActive !== undefined && (
              <span className="flex items-center gap-1"><CalendarClock size={11} />{product.seller.yearsActive} yrs active</span>
            )}
            {product.seller.ordersFulfilled !== undefined && (
              <span className="flex items-center gap-1"><Package size={11} />{product.seller.ordersFulfilled}+ orders</span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={11} />{product.seller.city}{product.seller.distanceKm ? ` · ${product.seller.distanceKm}km` : ''}
            </span>
            <span className="flex items-center gap-1 text-green-500 dark:text-green-400"><Lock size={11} />Escrow protected</span>
            {product.seller.isGstRegistered && (
              <span className="flex items-center gap-1"><FileText size={11} />GST registered</span>
            )}
          </div>
        </div>

        {/* Logistics */}
        <div className="mb-3 grid grid-cols-2 gap-1.5 text-[10px] text-text-secondary dark:text-dark-text-secondary">
          <span className="flex items-center gap-1"><Package size={11} />MOQ {product.moq}{product.maxOrderQty ? ` · max ${product.maxOrderQty}` : ''}</span>
          {product.deliveryEta && <span className="flex items-center gap-1"><Truck size={11} />{product.deliveryEta}</span>}
          {!!product.freeDeliveryAbove && (
            <span className="flex items-center gap-1"><Gift size={11} />Free above ₹{product.freeDeliveryAbove}</span>
          )}
          <span className={cn('flex items-center gap-1', product.inStock ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400')}>
            <CheckCircle2 size={11} />
            {product.inStock ? (product.stockQty ? `In stock · ${product.stockQty}` : 'In stock') : 'Out of stock'}
          </span>
        </div>

        {/* Specifications */}
        {!!product.specifications?.length && (
          <div className="mb-3 grid grid-cols-2 gap-1.5 text-[10px] text-text-secondary dark:text-dark-text-secondary">
            {product.specifications.slice(0, 6).map(s => (
              <span key={s.key} className="flex items-center gap-1">
                <Info size={11} className="flex-shrink-0" />
                {s.label}: {s.value}
              </span>
            ))}
          </div>
        )}

        {/* Payment/Trust */}
        <div className="mb-4 grid grid-cols-2 gap-1.5 text-[10px] text-text-secondary dark:text-dark-text-secondary">
          {product.gstInvoiceAvailable && <span className="flex items-center gap-1"><FileText size={11} />GST invoice</span>}
          {product.tradeCreditEligible && <span className="flex items-center gap-1"><Wallet size={11} />Trade credit ok</span>}
          <span className="col-span-2 flex items-center gap-1"><CreditCard size={11} />Razorpay · UPI · Cards · Net Banking</span>
          {product.returnPolicy && <span className="col-span-2 flex items-center gap-1"><RotateCcw size={11} />{product.returnPolicy}</span>}
        </div>

        <div className="flex-1" />

        {/* Buy Now */}
        <button onClick={handleBuyNow}
          disabled={!product.inStock}
          className="mb-2 w-full rounded-lg bg-primary-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-40 dark:bg-primary-500 dark:hover:bg-primary-600">
          <ShoppingCart size={14} className="inline mr-1.5" /> {product.inStock ? 'Buy Now' : 'Out of Stock'}
        </button>

        {/* Action buttons grid */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleChat}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] font-medium text-text-secondary transition-all hover:bg-surface-secondary hover:text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary dark:hover:text-dark-text-primary">
            <MessageCircle size={13} /> Chat
          </button>
          <button onClick={handleRFQ}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] font-medium text-text-secondary transition-all hover:bg-surface-secondary hover:text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary dark:hover:text-dark-text-primary">
            <FileQuestion size={13} /> RFQ
          </button>
          <button onClick={handleCompare}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all',
              inCompare
                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary dark:hover:text-dark-text-primary'
            )}>
            <ArrowLeftRight size={13} /> {inCompare ? 'Added' : 'Compare'}
          </button>
          <Link href={`/product/${product.slug}`}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] font-medium text-text-secondary transition-all hover:bg-surface-secondary hover:text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary dark:hover:text-dark-text-primary">
            <Info size={13} /> Details
          </Link>
        </div>

        {/* Share */}
        <button onClick={handleShare}
          className="mt-2 flex items-center justify-center gap-1 text-[10px] text-text-tertiary transition-colors hover:text-text-secondary dark:text-dark-text-tertiary dark:hover:text-dark-text-secondary">
          <Share2 size={11} /> Share this product
        </button>
      </div>
    </div>
  );
}
