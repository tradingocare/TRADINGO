'use client';

import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const modalVariants = cva(
  'relative w-full rounded-2xl border border-border bg-bg-elevated text-text-primary shadow-xl isolate backdrop-blur-2xl',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'mx-4 max-w-full',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export interface ModalProps extends VariantProps<typeof modalVariants> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

export function Modal({ open, onClose, title, description, children, size, className, showClose = true }: ModalProps) {
  const prefersReduced = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={modalRef}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
            className={cn(modalVariants({ size }), className)}
          >
            {(title || showClose) && (
              <div className="flex items-start justify-between p-6 pb-0">
                <div className="min-w-0 flex-1">
                  {title && <h2 className="text-xl font-semibold text-text-primary">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-tertiary transition-all duration-200 hover:bg-surface-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
