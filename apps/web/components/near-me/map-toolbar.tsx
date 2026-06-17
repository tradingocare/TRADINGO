'use client';

import { Crosshair, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

interface MapToolbarProps {
  onLocateMe: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  geoLoading?: boolean;
  geoStatus?: 'idle' | 'loading' | 'done' | 'error';
}

export function MapToolbar({
  onLocateMe,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  isFullscreen,
  geoLoading,
  geoStatus,
}: MapToolbarProps) {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5" role="toolbar" aria-label="Map controls">
      <button
        type="button"
        onClick={onLocateMe}
        disabled={geoLoading}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface dark:bg-dark-surface shadow-md border border-surface-border dark:border-dark-border hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors disabled:opacity-50"
        aria-label="Use current location"
        title="Use my location"
      >
        <Crosshair className={`h-4 w-4 text-text-secondary dark:text-dark-text-secondary ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
      </button>
      {onZoomIn && (
        <button
          type="button"
          onClick={onZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface dark:bg-dark-surface shadow-md border border-surface-border dark:border-dark-border hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
        </button>
      )}
      {onZoomOut && (
        <button
          type="button"
          onClick={onZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface dark:bg-dark-surface shadow-md border border-surface-border dark:border-dark-border hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
        </button>
      )}
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface dark:bg-dark-surface shadow-md border border-surface-border dark:border-dark-border hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen map' : 'Fullscreen map'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          ) : (
            <Maximize2 className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          )}
        </button>
      )}
    </div>
  );
}
