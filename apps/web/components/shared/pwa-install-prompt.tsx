'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-border bg-surface p-4 shadow-2xl dark:bg-dark-surface dark:border-dark-border">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Install TRADINGO</p>
          <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
            Get the best experience with our app. Install for faster access.
          </p>
        </div>
        <button onClick={() => setShowPrompt(false)} className="rounded-lg p-1 text-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={handleInstall} size="sm" className="flex-1">Install</Button>
        <Button onClick={() => setShowPrompt(false)} variant="outline" size="sm" className="flex-1">Not now</Button>
      </div>
    </div>
  );
}
