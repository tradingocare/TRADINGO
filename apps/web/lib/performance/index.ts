/**
 * Reports Web Vitals to analytics endpoint.
 * Usage: call in `app/layout.tsx` — `useReportWebVitals(measurePageLoad)`
 */
export function measurePageLoad(_name: string): void {
  const handler = (metric: { name: string; value: number; rating: string; delta: number; id: string }) => {
    const body: Record<string, unknown> = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      page: window.location.pathname,
      timestamp: Date.now(),
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', JSON.stringify(body));
    } else {
      fetch('/api/vitals', {
        method: 'POST',
        body: JSON.stringify(body),
        keepalive: true,
      });
    }
  };

  // Dynamic import to avoid bundling web-vitals in main chunk
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(handler);
    onFCP(handler);
    onLCP(handler);
    onTTFB(handler);
    onINP(handler);
  });
}

/**
 * Dynamically imports a component for code-splitting.
 * Wraps `next/dynamic` with a consistent loading pattern.
 */
export function lazyLoadComponent<T extends object>(
  importFn: () => Promise<T>,
): T {
  // next/dynamic handles this at the component level; this utility
  // is for non-component modules (e.g., heavy libraries).
  const cached: { instance?: T } = {};
  return new Proxy({} as T, {
    get: (_, prop) => {
      if (!cached.instance) {
        // Trigger eager load but don't block
        cached.instance = {} as T;
        importFn().then((mod) => {
          cached.instance = mod;
        });
      }
      return (...args: unknown[]) => {
        return importFn().then((mod) => {
          const fn = (mod as Record<string, unknown>)[prop as string];
          if (typeof fn === 'function') {
            return (fn as (...a: unknown[]) => unknown)(...args);
          }
          return fn;
        });
      };
    },
  }) as T;
}

/**
 * Prefetches a page when the user hovers over a link.
 * Uses the browser's `<link rel="prefetch">` or Next.js router.
 */
export function prefetchOnHover(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = 'document';
  document.head.appendChild(link);

  // Clean up after prefetch
  setTimeout(() => {
    link.remove();
  }, 10000);
}

/**
 * Creates a debounced version of a search function.
 * Returns a function that delays invoking `fn` until `ms` milliseconds
 * have elapsed since the last invocation. Supports async functions.
 *
 * @example
 * const search = debounceSearch(async (q: string) => {
 *   const res = await fetch(`/api/search?q=${q}`);
 *   return res.json();
 * }, 300);
 */
export function debounceSearch<T>(
  fn: (query: string) => T,
  ms: number,
): (query: string) => Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolveQueue: ((value: T | PromiseLike<T>) => void) | null = null;
  let rejectQueue: ((reason: unknown) => void) | null = null;

  return (query: string): Promise<T> => {
    if (timer) {
      clearTimeout(timer);
    }
    return new Promise<T>((resolve, reject) => {
      resolveQueue = resolve;
      rejectQueue = reject;
      timer = setTimeout(async () => {
        try {
          const result = await fn(query);
          resolveQueue?.(result);
        } catch (error) {
          rejectQueue?.(error);
        }
        timer = null;
        resolveQueue = null;
        rejectQueue = null;
      }, ms);
    });
  };
}

/**
 * Custom image loader for `next/image` that supports CDN transformation.
 *
 * @example
 * // next.config.js
 * images: {
 *   loader: 'custom',
 *   loaderFile: './lib/performance/index.ts',
 * }
 */
export function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.tradingo.in';

  // If it's already an absolute URL, use as-is
  if (src.startsWith('http')) {
    return src;
  }

  // CDN transformation params (CloudFront + Lambda@Edge)
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 75),
    f: 'auto', // auto WebP/AVIF format negotiation
  });

  return `${cdnBase}/image?${params.toString()}`;
}
