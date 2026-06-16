'use client';

import { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  show: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const typeStyles: Record<string, string> = {
  info: 'border-l-primary-500',
  success: 'border-l-accent-500',
  warning: 'border-l-amber-500',
  error: 'border-l-red-500',
};

export function Toast({ show, title, message, type = 'info', onDismiss, onAction, actionLabel }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) setMounted(true);
    else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-surface shadow-2xl transition-all duration-300 dark:bg-dark-surface dark:border-dark-border',
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        typeStyles[type],
        'border-l-4',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{title}</p>
          <p className="mt-0.5 text-sm text-text-secondary dark:text-dark-text-secondary">{message}</p>
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {actionLabel} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
        <button onClick={onDismiss} className="flex-shrink-0 rounded-lg p-1 text-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
