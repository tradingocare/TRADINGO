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

let toastListeners: ((toast: Toast) => void)[] = [];
let toastId = 0;

export function toast(options: ToastOptions) {
  const id = String(++toastId);
  const newToast: Toast = { id, ...options };
  toastListeners.forEach((listener) => listener(newToast));
  return id;
}

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
