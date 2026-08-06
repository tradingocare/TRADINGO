'use client';

import { useState, useCallback, useEffect } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastFn {
  (options: ToastOptions): string;
  success: (message: string, description?: string) => string;
  error: (message: string, description?: string) => string;
}

let toastListeners: Set<(toast: Toast) => void> = new Set();
let toastIdCounter = 0;

const toastFn: ToastFn = (options: ToastOptions) => {
  const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${++toastIdCounter}`;
  const newToast: Toast = { id, ...options };
  toastListeners.forEach((listener) => listener(newToast));
  return id;
};

toastFn.success = (message: string, description?: string) =>
  toast({ title: message, description, variant: 'default' });

toastFn.error = (message: string, description?: string) =>
  toast({ title: message, description, variant: 'destructive' });

export const toast = toastFn;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => (prev.some((x) => x.id === t.id) ? prev : [...prev, t]));
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 5000);
  }, []);

  useEffect(() => {
    toastListeners.add(addToast);
    return () => {
      toastListeners.delete(addToast);
    };
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}