'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const prefersReduced = useReducedMotion();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i).map((t) => (
          <motion.div
            key={t.id}
            initial={prefersReduced ? {} : { opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={prefersReduced ? {} : { opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
            transition={prefersReduced ? {} : { type: 'spring', damping: 20, stiffness: 300 }}
            className={`flex w-80 items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl ${
               t.variant === 'destructive'
                ? 'border-status-error/30 bg-status-error/40'
                : 'border-status-success/30 bg-status-success/30'
            }`}
          >
            {t.variant === 'destructive' ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-error" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-text-secondary">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-lg p-1 text-text-tertiary transition-colors hover:text-text-primary"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
