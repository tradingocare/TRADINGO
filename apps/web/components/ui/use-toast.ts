'use client';

import { useState, useCallback } from 'react';

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

let toastListeners: ((toast: Toast) => void)[] = [];
let toastIdCounter = 0;

const toastFn: ToastFn = (options: ToastOptions) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${++toastIdCounter}`;
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
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 5000);
  }, []);

  useState(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  });

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}