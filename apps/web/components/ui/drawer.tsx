'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title?: string;
  children: ReactNode;
  className?: string;
}

const sideVariants = {
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    style: { left: 0 } as React.CSSProperties,
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    style: { right: 0 } as React.CSSProperties,
  },
};

export function Drawer({ open, onClose, side = 'right', title, children, className }: DrawerProps) {
  const prefersReduced = useReducedMotion();

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

  const { initial, animate, exit, style } = sideVariants[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={prefersReduced ? { x: 0 } : initial}
            animate={{ x: 0 }}
            exit={prefersReduced ? { x: 0 } : exit}
            transition={prefersReduced ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
            style={style}
            className={cn(
              'fixed top-0 bottom-0 w-full max-w-sm border-l border-border bg-bg-elevated text-text-primary shadow-xl backdrop-blur-2xl',
              side === 'left' ? 'border-r border-l-0' : 'border-l',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
              <button
                onClick={onClose}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-text-tertiary transition-all duration-200 hover:bg-surface-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ height: 'calc(100% - 65px)' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
