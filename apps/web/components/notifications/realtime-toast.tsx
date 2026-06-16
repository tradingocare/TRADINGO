'use client';

import { useEffect, useState } from 'react';

export function NotificationToast() {
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleEvent = (e: CustomEvent) => {
      setToast(e.detail);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    };
    window.addEventListener('trdn:toast' as any, handleEvent as any);
    return () => window.removeEventListener('trdn:toast' as any, handleEvent as any);
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-surface p-4 shadow-2xl transition-all duration-300 dark:bg-dark-surface dark:border-dark-border ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{toast.title}</p>
      <p className="mt-0.5 text-sm text-text-secondary dark:text-dark-text-secondary">{toast.message}</p>
    </div>
  );
}

export function showToast(title: string, message: string, type = 'info') {
  window.dispatchEvent(new CustomEvent('trdn:toast', { detail: { title, message, type } }));
}
