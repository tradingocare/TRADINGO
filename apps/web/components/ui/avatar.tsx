'use client';

import { forwardRef, useState } from 'react';
import { User } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const avatarTextVariants = cva('font-semibold uppercase text-text-secondary', {
  variants: {
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
      xl: 'text-xl',
    },
  },
  defaultVariants: { size: 'default' },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({ src, alt = '', fallback, size, className }, ref) => {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;

  const initials = fallback || '?';

  return (
    <div ref={ref} className={cn(avatarVariants({ size }), className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={cn(avatarTextVariants({ size }))}>
          {fallback ? initials.slice(0, 2) : <User className="h-1/2 w-1/2" aria-hidden="true" />}
        </span>
      )}
    </div>
  );
});
Avatar.displayName = 'Avatar';

export { Avatar };
