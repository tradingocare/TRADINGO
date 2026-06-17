'use client';

interface MapLegendProps {
  productCount: number;
  verifiedCount?: number;
  radiusKm: number;
}

export function MapLegend({ productCount, verifiedCount, radiusKm }: MapLegendProps) {
  return (
    <div
      className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-surface/90 dark:bg-dark-surface/90 backdrop-blur-sm border border-surface-border dark:border-dark-border px-3 py-2 shadow-sm text-xs"
      role="status"
      aria-label={`${productCount} products within ${radiusKm} km`}
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2563eb] border border-white shadow-sm" aria-hidden="true" />
          <span className="text-text-primary dark:text-dark-text-primary font-medium">{productCount}</span>
          <span className="text-text-tertiary dark:text-dark-text-tertiary">products</span>
        </span>
        {verifiedCount !== undefined && verifiedCount > 0 && (
          <>
            <span className="text-text-tertiary dark:text-dark-text-tertiary">|</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#16a34a] border border-white shadow-sm" aria-hidden="true" />
              <span className="text-text-primary dark:text-dark-text-primary font-medium">{verifiedCount}</span>
              <span className="text-text-tertiary dark:text-dark-text-tertiary">verified</span>
            </span>
          </>
        )}
      </div>
      <p className="text-[10px] text-text-tertiary dark:text-dark-text-tertiary mt-0.5">
        Radius: {radiusKm} km
      </p>
    </div>
  );
}
