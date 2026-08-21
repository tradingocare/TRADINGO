'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'tradingo-pwa-install-dismissed-v1';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

type InstalledRelatedApp = { id?: string; platform?: string };

function getInstalledRelatedApps(): Promise<InstalledRelatedApp[]> | null {
  try {
    if (typeof navigator === 'undefined') return null;
    const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]> };
    return nav.getInstalledRelatedApps ? nav.getInstalledRelatedApps() : null;
  } catch {
    return null;
  }
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* storage unavailable */
  }
}

async function isInstalledRelatedApp(): Promise<boolean> {
  const related = getInstalledRelatedApps();
  if (!related) return false;
  try {
    const apps = await related;
    return apps.some((app) => app.id === location.origin || app.id === location.origin + '/' || (app.id ? app.id.startsWith(location.origin) : false));
  } catch {
    return false;
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    let cancelled = false;
    let installed = false;

    const dismiss = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    const installedState = async () => {
      const related = await isInstalledRelatedApp();
      if (!cancelled && (related || isStandalone())) {
        installed = true;
        dismiss();
      }
    };
    installedState();

    const handler = (e: Event) => {
      if (installed || isStandalone() || isDismissed()) return;
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    const onAppInstalled = () => {
      installed = true;
      dismiss();
      persistDismissed();
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result?.outcome === 'accepted') {
      setShowPrompt(false);
      persistDismissed();
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-border bg-surface p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">Install TRADINGO</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Get the best experience with our app. Install for faster access.
          </p>
        </div>
        <button
          onClick={() => {
            setShowPrompt(false);
            persistDismissed();
          }}
          aria-label="Dismiss install prompt"
          className="rounded-lg p-1 text-text-tertiary hover:bg-surface-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={handleInstall} size="sm" className="flex-1">
          Install
        </Button>
        <Button
          onClick={() => {
            setShowPrompt(false);
            persistDismissed();
          }}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Not now
        </Button>
      </div>
    </div>
  );
}