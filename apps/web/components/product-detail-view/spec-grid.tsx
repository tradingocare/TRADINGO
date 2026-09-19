'use client';

import { Download } from 'lucide-react';
import type { ProductDetailViewData } from '@/types/product-detail-view';

const GRADIENT_BORDER = 'linear-gradient(90deg, #FF4D00, #F59E0B, #3D8BFF, #9B5DE5)';

interface SpecGridProps {
  data: ProductDetailViewData;
}

export function SpecGrid({ data }: SpecGridProps) {
  const fallbackSpecs = [
    { key: 'moq', label: 'MOQ', value: String(data.moq) },
    ...(data.unit ? [{ key: 'unit', label: 'Unit', value: data.unit }] : []),
    ...(data.leadTime ? [{ key: 'lead-time', label: 'Lead Time', value: data.leadTime }] : []),
    { key: 'availability', label: 'Availability', value: data.stock.statusLabel },
  ];
  const specs = (data.specs?.length ? data.specs : fallbackSpecs).slice(0, 6);
  // Highlights are vendor/catalog data only. No invented fallback claims —
  // when nothing real exists the highlights block stays hidden.
  const highlights = data.highlights?.length ? data.highlights : [];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-base font-semibold text-text-primary">Key Specifications &amp; Highlights</h3>

      <div className="mt-4 rounded-2xl p-[1.5px]" style={{ background: GRADIENT_BORDER }}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[14px] bg-surface px-4 py-2.5">
          {specs.map((spec, index) => (
            <span key={spec.key} className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
              {index > 0 && (
                <span className="mr-1.5 h-1 w-1 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
              )}
              <span className="text-text-tertiary">{spec.label || spec.key}:</span>
              <span className="font-semibold text-text-primary">{spec.value}</span>
            </span>
          ))}
        </div>
      </div>

      {data.specs && data.specs.length > 6 && (
        <a href="#specifications" className="mt-3 inline-block text-xs font-bold text-accent transition-colors hover:underline">
          View All Specifications
        </a>
      )}
      {highlights.length > 0 && (
        <p className="mt-4 rounded-xl bg-bg-elevated px-3 py-2 text-xs leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Highlights:</strong>{' '}
          {highlights.map((highlight) => `• ${highlight}`).join(' ')}
        </p>
      )}
    </div>
  );
}

interface DocumentsSectionProps {
  data: ProductDetailViewData;
}

export function DocumentsSection({ data }: DocumentsSectionProps) {
  // Vendor-supplied documents only (ProductMedia DOCUMENT rows). When the
  // vendor supplied nothing we show an honest empty state — never
  // auto-generated placeholder PDFs.
  const docs = data.documents || [];

  if (docs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">Documents &amp; Downloads</h3>
        <p className="mt-3 rounded-xl bg-bg-elevated px-3 py-2 text-xs leading-relaxed text-text-secondary">
          No documents provided by the seller yet. Use RFQ or Chat to request datasheets, catalogs, or compliance certificates.
        </p>
      </div>
    );
  }

  const handleDownload = (name: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-text-primary">Documents &amp; Downloads</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {docs.slice(0, 4).map((doc) => (
          <div
            key={`${doc.name}-${doc.url}`}
            className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2 transition-all hover:border-accent/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-text-primary">{doc.name}</p>
              <p className="text-[9px] text-text-tertiary">{doc.size || doc.type || 'Vendor document'}</p>
            </div>
            <button
              onClick={() => handleDownload(doc.name, doc.url)}
              aria-label={`Download ${doc.name}`}
              className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent transition-all hover:bg-accent hover:text-btn-primary-text"
            >
              <Download size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
