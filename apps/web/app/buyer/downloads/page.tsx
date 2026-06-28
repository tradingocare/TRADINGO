'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { useBuyerDownloads } from '@/hooks';
import { Download, FileText, FileImage, FileArchive, File, Search, Loader2 } from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string }> = {
  CATALOGUE: { icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  BROCHURE: { icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  CERTIFICATE: { icon: FileImage, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  INVOICE: { icon: FileText, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
};

export default function BuyerDownloadsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useBuyerDownloads();

  const items = (data?.items ?? []).filter((d: any) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="My Downloads" description="Access your downloaded documents and files" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input placeholder="Search downloads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Download className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No downloads yet</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Download catalogues, brochures, and invoices from suppliers.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((dl: any) => {
            const cfg = typeConfig[dl.type] ?? { icon: File, color: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary' };
            const Icon = cfg.icon;
            return (
              <div key={dl.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-[#FF5A1F]/20 dark:bg-dark-surface dark:border-dark-border">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{dl.title}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-text-tertiary">
                    <span className="uppercase">{dl.type}</span>
                    {dl.fileSize && <span>{(dl.fileSize / 1024).toFixed(1)} KB</span>}
                    <span>{new Date(dl.createdAt).toLocaleDateString('en-IN')}</span>
                    {dl.sourceModule && <span>from {dl.sourceModule}</span>}
                  </div>
                </div>
                <a href={dl.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#FF5A1F]/10 px-3 py-2 text-xs font-medium text-[#FF5A1F] transition-colors hover:bg-[#FF5A1F]/20">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
