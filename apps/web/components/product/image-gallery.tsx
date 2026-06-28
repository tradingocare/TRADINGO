'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';
import { type ProductDetailMedia } from '@/types/product-detail';

const GLASS = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.09)';

interface ImageGalleryProps {
  media: ProductDetailMedia[];
  productName: string;
}

export function ImageGallery({ media, productName }: ImageGalleryProps) {
  const images = media.filter((m) => m.type === 'IMAGE');
  const videos = media.filter((m) => m.type === 'VIDEO');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, index: 0 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentImage = images[selectedIndex];
  const currentVideo = videos[0];

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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, handlePrev, handleNext]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mainRef.current || !zoom || isFullscreen) return;
      const rect = mainRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    [zoom, isFullscreen],
  );

  const handleDragStart = (e: React.MouseEvent, index: number) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, index });
  };

  const handleDragEnd = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = e.clientX - dragStart.x;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  if (images.length === 0 && videos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl" style={{ background: GLASS, border: BORDER }}>
        <span className="text-white/40 text-sm">No media available</span>
      </div>
    );
  }

  const mainContent = () => {
    if (images.length > 0) {
      return (
          <div
            ref={mainRef}
            className={cn(
              'relative flex aspect-square cursor-crosshair items-center justify-center overflow-hidden rounded-3xl',
              isFullscreen && 'rounded-none border-0',
            )}
            style={{ background: GLASS, border: BORDER }}
            onMouseMove={handleMouseMove}
          onMouseEnter={() => !isFullscreen && setZoom(true)}
          onMouseLeave={() => { setZoom(false); setIsDragging(false); }}
          onMouseDown={(e) => handleDragStart(e, selectedIndex)}
          onMouseUp={handleDragEnd}
          onPointerLeave={() => setIsDragging(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={currentImage.url || '/placeholder.svg'}
            alt={currentImage.title || `${productName} - Image ${selectedIndex + 1}`}
            fill
            className={cn(
              'object-contain select-none',
              zoom && !isFullscreen && 'scale-150',
              'transition-transform duration-200',
            )}
            style={
              zoom && !isFullscreen
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : undefined
            }
            sizes={isFullscreen ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
            priority={selectedIndex === 0}
            draggable={false}
          />
          {images.length > 1 && (
            <>
              <button onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white/10 opacity-0 group-hover:opacity-100"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)' }} aria-label="Previous image">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white/10 opacity-0 group-hover:opacity-100"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)' }} aria-label="Next image">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute right-3 top-3 rounded-full p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/10"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)' }}
            aria-label="View fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (currentVideo) {
      return (
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-black" style={{ border: BORDER }}>
          <video
            src={currentVideo.url}
            controls
            className="h-full w-full object-contain"
            poster="/placeholder.svg"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Play className="h-16 w-16 text-white/80" />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="group relative">
        {mainContent()}

        {images.length > 1 && (
          <div
            ref={scrollRef}
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
          >
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                )}
                style={{
                  borderColor: idx === selectedIndex ? '#FF4D00' : 'rgba(255,255,255,0.15)',
                  opacity: idx === selectedIndex ? 1 : 0.6,
                }}
              >
                <Image
                  src={img.url || '/placeholder.svg'}
                  alt={img.title || `${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close fullscreen"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <kbd className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-xs">←</kbd>
            {selectedIndex + 1} / {images.length}
            <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs">→</kbd>
          </div>
        </div>
      )}
    </>
  );
}
