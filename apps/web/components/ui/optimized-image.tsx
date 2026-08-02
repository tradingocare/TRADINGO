'use client';

import { useState, useCallback } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'className'> {
  className?: string;
  containerClassName?: string;
  blurIntensity?: 'sm' | 'md' | 'lg';
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  blurIntensity = 'md',
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const blurMap = { sm: 'blur-sm', md: 'blur-md', lg: 'blur-lg' };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {!loaded && (
        <div
          className={cn(
            'absolute inset-0 bg-surface transition-opacity duration-500',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
        />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(
          'transition-all duration-500',
          loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-90 scale-105 blur-md',
          className,
        )}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
}
