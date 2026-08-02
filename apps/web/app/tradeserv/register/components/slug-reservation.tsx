'use client';

import { Check, Copy, Link } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES } from '../types';

interface Props {
  slug: string;
  category: string;
}

export function SlugReservation({ slug, category }: Props) {
  const [copied, setCopied] = useState<'profile' | 'category' | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingo.com';
  const profileUrl = `${baseUrl}/tradeserv/p/${slug}`;
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  const categoryUrl = `${baseUrl}/tradeserv/c/${categorySlug}`;

  const copyToClipboard = async (url: string, type: 'profile' | 'category') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Your Reserved URLs</h3>
      <p className="text-xs text-text-tertiary">
        These URLs are reserved for you. They will become active once your profile is approved and published.
      </p>

      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <Link size={14} className="text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">Professional Profile</p>
                <p className="mt-0.5 text-xs text-text-tertiary font-mono">{profileUrl}</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(profileUrl, 'profile')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-tertiary transition-colors hover:border-accent/30 hover:text-accent"
            >
              {copied === 'profile' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Link size={14} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">Category Page</p>
                <p className="mt-0.5 text-xs text-text-tertiary font-mono">{categoryUrl}</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(categoryUrl, 'category')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-tertiary transition-colors hover:border-accent/30 hover:text-accent"
            >
              {copied === 'category' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
        <p className="text-[10px] leading-relaxed text-yellow-400/80">
          These URLs are reserved but not yet published. Your profile will remain private until all verification
          steps are complete. Sharing these URLs before approval will show a &quot;Profile Not Found&quot; page.
        </p>
      </div>
    </div>
  );
}
