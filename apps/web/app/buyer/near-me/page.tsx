'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Crosshair, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardPageHeader } from '@/components/dashboard';
import { RadiusSelector } from '@/components/near-me/radius-selector';
import { FilterDrawer } from '@/components/near-me/filter-drawer';
import type { FilterState } from '@/components/near-me/filter-drawer';
import { SortDropdown } from '@/components/near-me/sort-dropdown';
import { NearMeProductCard } from '@/components/near-me/near-me-product-card';
import { NearMeSkeleton } from '@/components/near-me/near-me-skeleton';
import { searchProducts, getRadiusBreakdown } from '@/lib/api/near-me';
import type { NearMeProduct, NearMeMeta } from '@/lib/api/near-me';

type SortOption = 'distance' | 'trust' | 'price_asc' | 'price_desc' | 'trending' | 'delivery';

const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 };

function NearMeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [center, setCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [radius, setRadius] = useState(25);
  const [sort, setSort] = useState<SortOption>('distance');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<NearMeProduct[]>([]);
  const [meta, setMeta] = useState<NearMeMeta | null>(null);
  const [radiusCounts, setRadiusCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const loaderRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    minTrustScore: '',
    verifiedOnly: false,
    tradgoOnly: false,
    maxMoq: '',
    deliveryTime: '',
  });

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const r = searchParams.get('radius');
    const s = searchParams.get('sort');
    if (lat && lng) {
      setCenter({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    if (r) setRadius(parseInt(r, 10));
    if (s && ['distance', 'trust', 'price_asc', 'price_desc', 'trending', 'delivery'].includes(s)) {
      setSort(s as SortOption);
    }
  }, []);

  const syncUrl = useCallback((c: { lat: number; lng: number }, r: number, s: string) => {
    const params = new URLSearchParams();
    params.set('lat', c.lat.toFixed(4));
    params.set('lng', c.lng.toFixed(4));
    params.set('radius', r.toString());
    params.set('sort', s);
    router.replace(`/buyer/near-me?${params.toString()}`, { scroll: false });
  }, [router]);

  const fetchProducts = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const result = await searchProducts({
        lat: center.lat,
        lng: center.lng,
        radius,
        sort,
        page: pageNum,
        limit: 20,
        ...(filters.minPrice ? { minPrice: parseFloat(filters.minPrice) } : {}),
        ...(filters.maxPrice ? { maxPrice: parseFloat(filters.maxPrice) } : {}),
        ...(filters.minTrustScore ? { minTrustScore: parseInt(filters.minTrustScore, 10) } : {}),
        ...(filters.verifiedOnly ? { verifiedOnly: true } : {}),
        ...(filters.tradgoOnly ? { tradgoOnly: true } : {}),
        ...(filters.maxMoq ? { maxMoq: parseInt(filters.maxMoq, 10) } : {}),
        ...(filters.deliveryTime ? { deliveryTime: filters.deliveryTime } : {}),
      });

      if (append) {
        setProducts((prev) => [...prev, ...result.data]);
      } else {
        setProducts(result.data);
      }
      setMeta(result.meta);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(errObj?.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [center.lat, center.lng, radius, sort, filters]);

  const fetchRadiusCounts = useCallback(async () => {
    try {
      const breakdown = await getRadiusBreakdown(center.lat, center.lng);
      const counts: Record<number, number> = {};
      breakdown.forEach((b) => { counts[b.radius] = b.count; });
      setRadiusCounts(counts);
    } catch {}
  }, [center.lat, center.lng]);

  useEffect(() => {
    fetchProducts(1, false);
    fetchRadiusCounts();
    syncUrl(center, radius, sort);
  }, [center.lat, center.lng, radius, sort, filters]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, true);
    }
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [radius, sort, filters]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(c);
        setGeoStatus('done');
      },
      () => {
        setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && meta && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  }, [loadingMore, meta, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loadMore]);

  const resetFilters = () => {
    setFilters({
      minPrice: '', maxPrice: '', minTrustScore: '',
      verifiedOnly: false, tradgoOnly: false, maxMoq: '', deliveryTime: '',
    });
  };

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Near Me"
        description="Discover products from suppliers around you"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search products near you..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={geoStatus === 'done' ? 'accent' : 'outline'}
            size="sm"
            onClick={detectLocation}
            disabled={geoStatus === 'loading'}
          >
            <Crosshair className={`mr-1.5 h-4 w-4 ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
            {geoStatus === 'loading' ? 'Detecting...' : 'Use My Location'}
          </Button>
          <FilterDrawer filters={filters} onChange={setFilters} onReset={resetFilters} />
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      <div className="sticky top-16 z-20 bg-surface-secondary py-2 dark:bg-dark-surface">
        <RadiusSelector
          selected={radius}
          onChange={(r) => setRadius(r)}
          counts={radiusCounts}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <NearMeSkeleton />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 dark:border-dark-border dark:bg-dark-surface">
          <MapPin className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No products found</h3>
          <p className="mt-1 text-sm text-text-tertiary dark:text-dark-text-tertiary text-center max-w-sm">
            {geoStatus === 'error'
              ? 'Enable location access or enter a location manually.'
              : 'Try increasing the radius or adjusting filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-text-tertiary dark:text-dark-text-tertiary">
            {meta && (
              <span>{meta.total} product{meta.total !== 1 ? 's' : ''} found within {radius} km</span>
            )}
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <NearMeProductCard key={product.id} product={product} />
            ))}
          </div>
          <div ref={loaderRef} className="py-4">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                Loading more...
              </div>
            )}
            {meta && page >= meta.totalPages && products.length > 0 && (
              <p className="text-center text-xs text-text-tertiary">All products loaded</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function NearMePage() {
  return (
    <Suspense fallback={<div className="space-y-5"><DashboardPageHeader title="Near Me" description="Discover products from suppliers around you" /><NearMeSkeleton /></div>}>
      <NearMeContent />
    </Suspense>
  );
}
