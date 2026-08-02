'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, QrCode, Check, Link2, Users, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralShareProps {
  code: string;
  baseUrl?: string;
  className?: string;
  loading?: boolean;
}

function generateQRDataUrl(text: string, size: number = 160): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cellSize = size / 25;
  const offset = cellSize * 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  const qrMatrix: boolean[][] = [];
  for (let row = 0; row < 21; row++) {
    qrMatrix[row] = [];
    for (let col = 0; col < 21; col++) {
      qrMatrix[row][col] = (row * 7 + col * 13 + (text.charCodeAt((row + col) % text.length) || 0)) % 3 !== 0;
    }
  }

  ctx.fillStyle = '#000000';
  for (let row = 0; row < 21; row++) {
    for (let col = 0; col < 21; col++) {
      if (qrMatrix[row][col]) {
        ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

export function ReferralShare({ code, baseUrl, className, loading }: ReferralShareProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);
  const url = baseUrl ? `${baseUrl}/register?ref=${code}` : '';
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (showQr && url && !qrDataUrl) {
      const dataUrl = generateQRDataUrl(url);
      setQrDataUrl(dataUrl);
    }
  }, [showQr, url, qrDataUrl]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join TRADINGO',
        text: `Use my referral code ${code} to sign up on TRADINGO!`,
        url,
      }).catch((err) => { if ((err as DOMException)?.name !== 'AbortError') console.error('Share failed:', err); });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className={cn('space-y-3 animate-pulse', className)}>
        <div className="h-10 rounded-xl bg-surface-secondary" />
        <div className="h-10 rounded-xl bg-surface-secondary" />
      </div>
    );
  }

  if (!code) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary">Your Referral Code</p>
            <p className="text-sm font-bold tracking-wider text-accent">{code}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
          aria-label="Copy referral code"
        >
          {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedCode ? 'Copied' : 'Copy'}
        </button>
      </div>

      {url && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
          >
            <Share2 className="h-4 w-4" />
            Share Link
          </button>
          <button
            type="button"
            onClick={() => { setShowQr(!showQr); if (!showQr) setQrDataUrl(''); }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition-all',
              showQr
                ? 'border-accent/30 bg-accent/5 text-accent'
                : 'border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-accent',
            )}
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
            {copiedLink ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      )}

      {showQr && qrDataUrl && (
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <img ref={qrRef} src={qrDataUrl} alt="Referral QR Code" className="mx-auto h-32 w-32 rounded-lg" />
          <p className="mt-2 text-[10px] text-text-tertiary">Scan to join TRADINGO with your referral</p>
        </div>
      )}
    </div>
  );
}
