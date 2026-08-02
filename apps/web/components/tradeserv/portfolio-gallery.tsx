'use client';

import { useState } from 'react';
import { ExternalLink, Image as ImageIcon, X } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description?: string | null;
  clientName?: string | null;
  completionDate?: string | null;
  media?: Record<string, unknown> | null;
  tags?: string[];
  isFeatured?: boolean;
  url?: string;
}

interface PortfolioGalleryProps {
  items: PortfolioItem[];
}

export function PortfolioGallery({ items }: PortfolioGalleryProps) {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-accent/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)]"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <ImageIcon className="h-5 w-5 text-accent" />
            </div>
            <h4 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
              {item.title}
            </h4>
            {item.description && (
              <p className="mt-1 text-xs text-text-tertiary line-clamp-2">{item.description}</p>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-surface-secondary border border-border px-1.5 py-0.5 text-[9px] text-text-tertiary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {item.clientName && (
              <p className="mt-2 text-[10px] text-text-tertiary">Client: {item.clientName}</p>
            )}
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-surface-secondary hover:bg-surface"
            >
              <X className="h-4 w-4 text-text-tertiary" />
            </button>

            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mb-4">
              <ImageIcon className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">{selected.title}</h3>
            {selected.description && (
              <p className="mt-2 text-sm leading-relaxed text-text-tertiary">{selected.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-tertiary">
              {selected.clientName && <span>Client: {selected.clientName}</span>}
              {selected.completionDate && (
                <span>Completed: {new Date(selected.completionDate).toLocaleDateString()}</span>
              )}
            </div>
            {selected.tags && selected.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] text-accent">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
