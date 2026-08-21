'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let firstInstall = true;
    let notified = false;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.active || navigator.serviceWorker.controller) {
          firstInstall = false;
        }

        const onUpdateFound = () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && !firstInstall && !notified) {
              notified = true;
              setUpdateAvailable(true);
            }
          });
        };

        reg.addEventListener('updatefound', onUpdateFound);
        if (reg.installing) onUpdateFound();
      })
      .catch(() => {
        // SW registration failed silently
      });
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 z-50 rounded-xl border border-border bg-surface p-4 shadow-2xl sm:left-auto sm:max-w-sm">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">New version available</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Reload to get the latest TRADINGO update.
          </p>
        </div>
        <button
          onClick={() => setUpdateAvailable(false)}
          aria-label="Dismiss update notice"
          className="rounded-lg p-1 text-text-tertiary hover:bg-surface-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3">
        <Button size="sm" className="w-full" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}