'use client';

import { Share2, QrCode, Check, Link2 } from 'lucide-react';
import { useState } from 'react';

interface ProfileShareProps {
  name: string;
  slug: string;
}

export function ProfileShare({ name, slug }: ProfileShareProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const profileUrl = `https://tradingo.com/tradeserv/p/${slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${name} — TradeServ`, url: profileUrl }).catch((err) => { if ((err as DOMException)?.name !== 'AbortError') console.error('Share failed:', err); });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[10px] font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[10px] font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
        >
          <QrCode className="h-3.5 w-3.5" />
          QR Code
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[10px] font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy Link'}
        </button>
      </div>

      {showQr && (
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-lg bg-white">
            <div className="text-center">
              <QrCode className="mx-auto h-20 w-20 text-black" />
              <p className="mt-1 text-[8px] text-gray-500 leading-tight max-w-[100px] mx-auto break-all">{slug}</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-text-tertiary">Scan to view profile</p>
        </div>
      )}
    </div>
  );
}
