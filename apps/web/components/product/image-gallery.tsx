'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';
import { type ProductDetailMedia } from '@/types/product-detail';

const PLACEHOLDER = '/placeholder-product.jpg';

interface ImageGalleryProps {
  media: ProductDetailMedia[];
  productName: string;
  compact?: boolean;
}

export function ImageGallery({ media, productName, compact = false }: ImageGalleryProps) {
  const images = media.filter((m) => m.type === 'IMAGE');
  const videos = media.filter((m) => m.type === 'VIDEO');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const mainRef = useRef<HTMLDivElement>(null);

  const safeSrc = useCallback((url: string | undefined) => {
    if (!url || failed[url]) return PLACEHOLDER;
    return url;
  }, [failed]);

  const currentImage = images[selectedIndex];
  const currentVideo = videos[0];

  const thumbItems = useMemo(() => {
    const items: (ProductDetailMedia & { kind: 'image' | 'video' })[] = [];
    images.slice(0, currentVideo ? 3 : 4).forEach((m) => items.push({ ...m, kind: 'image' }));
    if (currentVideo) items.push({ ...currentVideo, kind: 'video' });
    return items;
  }, [images, currentVideo]);

  const selectThumb = useCallback((item: { kind: 'image' | 'video' }, index: number) => {
    if (item.kind === 'video') {
      setShowVideo(true);
      return;
    }
    setShowVideo(false);
    setSelectedIndex(index);
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, handlePrev, handleNext]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!mainRef.current || !zoom || isFullscreen) return;
      const rect = mainRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    [zoom, isFullscreen],
  );

  const handleDragStart = (event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX });
  };

  const handleDragEnd = (event: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = event.clientX - dragStart.x;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStart(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  if (images.length === 0 && videos.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-2xl', compact ? 'aspect-[2/1]' : 'aspect-[4/3] border border-border bg-bg-elevated')}
        style={compact
          ? {
              border: '1.5px solid transparent',
              background:
                'linear-gradient(var(--bg-elevated), var(--bg-elevated)) padding-box, linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5) border-box',
            }
          : undefined}>
        <span className="text-sm text-text-tertiary">No media available</span>
      </div>
    );
  }

  const renderImage = () => {
    if (images.length === 0) return null;

    return (
      <div
        ref={mainRef}
        className={cn(
          'group relative flex items-center justify-center overflow-hidden rounded-2xl',
          compact ? 'aspect-[2/1]' : 'aspect-[4/3] cursor-crosshair border border-border bg-bg-base',
          isFullscreen && 'rounded-none border-0',
        )}
        style={compact && !isFullscreen
          ? {
              border: '1.5px solid transparent',
              background:
                'linear-gradient(var(--bg-base), var(--bg-base)) padding-box, linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5) border-box',
            }
          : undefined}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => !isFullscreen && setZoom(true)}
        onMouseLeave={() => {
          setZoom(false);
          setIsDragging(false);
        }}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onPointerLeave={() => setIsDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={safeSrc(currentImage.url)}
          alt={currentImage.title || `${productName} - Image ${selectedIndex + 1}`}
          fill
          onError={() => currentImage.url && setFailed(prev => ({ ...prev, [currentImage.url]: true }))}
          className={cn(
            'select-none object-contain transition-transform duration-200',
            !compact && zoom && !isFullscreen && 'scale-150',
          )}
          style={
            !compact && zoom && !isFullscreen
              ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
          sizes={isFullscreen ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
          priority={selectedIndex === 0}
          draggable={false}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-bg-base/75 p-2 text-text-primary opacity-0 backdrop-blur-md transition-opacity hover:bg-bg-elevated group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-bg-base/75 p-2 text-text-primary opacity-0 backdrop-blur-md transition-opacity hover:bg-bg-elevated group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className={cn(
            'absolute right-3 top-3 rounded-full border border-white/10 bg-bg-base/75 p-1.5 text-text-primary shadow-sm backdrop-blur-md transition-colors hover:bg-bg-elevated',
            compact && 'hidden',
          )}
          aria-label="View fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderVideo = () => {
    if (!currentVideo) return null;

    return (
      <div
        className={cn('relative flex items-center justify-center overflow-hidden rounded-2xl', compact ? 'aspect-[2/1]' : 'aspect-[4/3] border border-border bg-bg-base')}
        style={compact
          ? {
              border: '1.5px solid transparent',
              background:
                'linear-gradient(var(--bg-base), var(--bg-base)) padding-box, linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5) border-box',
            }
          : undefined}>
        <video
          src={currentVideo.url}
          controls
          className="h-full w-full object-contain"
          poster="/placeholder.svg"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Play className="h-16 w-16 text-text-tertiary" />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="group relative">
        {showVideo && currentVideo ? renderVideo() : (images.length > 0 ? renderImage() : renderVideo())}

        {thumbItems.length > 1 && (
          <div
            className="mt-2 flex gap-2 overflow-x-auto rounded-b-2xl border border-t-0 border-border bg-bg-elevated/90 p-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {thumbItems.map((item, index) => {
              const isActive = item.kind === 'video'
                ? showVideo
                : selectedIndex === images.indexOf(item);
              return (
                <button
                  key={item.id + index}
                  type="button"
                  onClick={() => selectThumb(item, index)}
                  className={cn(
                    'relative flex-shrink-0 overflow-hidden rounded-xl border transition-all',
                    compact ? 'h-10 w-10' : 'h-16 w-16',
                    isActive ? 'opacity-100' : 'opacity-70',
                  )}
                  style={{
                    borderColor: isActive ? 'var(--accent)' : 'var(--border-color)',
                  }}
                  aria-label={item.kind === 'video' ? 'Play product video' : `${productName} thumbnail ${index + 1}`}
                >
                  <Image
                    src={safeSrc(item.url)}
                    alt={item.title || `${productName} thumbnail ${index + 1}`}
                    fill
                    onError={() => item.url && setFailed(prev => ({ ...prev, [item.url]: true }))}
                    className="object-cover"
                    sizes="64px"
                  />
                  {item.kind === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-bg-base/50">
                      <Play className={compact ? 'h-3 w-3 text-text-primary' : 'h-5 w-5 text-text-primary'} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isFullscreen && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/95 backdrop-blur-sm"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-full border border-border bg-bg-elevated p-2 text-text-primary transition-colors hover:bg-surface"
            aria-label="Close fullscreen"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-elevated p-2 text-text-primary transition-colors hover:bg-surface"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-elevated p-2 text-text-primary transition-colors hover:bg-surface"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="relative flex h-full w-full items-center justify-center">
            <Image
              src={currentImage.url || '/placeholder.svg'}
              alt={currentImage.title || `${productName} - Fullscreen`}
              fill
              className="object-contain p-8"
              sizes="100vw"
              priority
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-bg-elevated px-4 py-2 text-sm text-text-primary backdrop-blur-sm">
            <kbd className="mr-2 rounded bg-bg-base/70 px-1.5 py-0.5 text-xs">←</kbd>
            {selectedIndex + 1} / {images.length}
            <kbd className="ml-2 rounded bg-bg-base/70 px-1.5 py-0.5 text-xs">→</kbd>
          </div>
        </div>
      )}
    </>
  );
}
