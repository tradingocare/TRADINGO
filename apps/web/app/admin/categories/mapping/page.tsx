'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import {
  FolderTree,
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useMappingCoverage } from '@/hooks/use-marketplace-catalog-bridge';
import { Tabs } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';

export default function CategoryMappingPage() {
  const { data: coverageData, isLoading, error } = useMappingCoverage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'mapped' | 'unmapped'>('mapped');
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportUnmapped = () => {
    if (!coverageData?.unmappedOld || coverageData.unmappedOld.length === 0) {
      toast({
        title: 'No unmapped categories',
        description: 'All categories are mapped to the Master Catalog!',
        variant: 'default',
      });
      return;
    }

    try {
      const headers = ['Legacy Category ID', 'Legacy Category Name', 'Legacy Category Slug'];
      const rows = coverageData.unmappedOld.map((cat) => [
        cat.oldId,
        `"${cat.oldName.replace(/"/g, '""')}"`,
        cat.oldSlug,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `tradingo_unmapped_categories_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Export Initiated',
        description: `Exported ${coverageData.unmappedOld.length} unmapped categories.`,
      });
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate CSV export.',
        variant: 'destructive',
      });
    }
  };

  const filteredMapped = (coverageData?.mapped || []).filter(
    (item) =>
      item.oldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.catalogName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnmapped = (coverageData?.unmappedOld || []).filter((item) =>
    item.oldName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-accent-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-white/60">Loading mapping coverage metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !coverageData) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Alert variant="error" title="Failed to load metrics">
          There was an error loading the category mappings. Please try again.
          <div className="mt-3">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-500 hover:bg-accent-500/90 transition-all">Retry Fetch</button>
          </div>
        </Alert>
      </div>
    );
  }

  const coveragePercent = coverageData.coverage || 0;

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation back */}
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent-500 hover:text-accent-500/80 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Categories List
        </Link>

        <PageHeader
          title="Marketplace Taxonomy Bridge"
          description="Monitor and align local legacy categories with the Master Catalog taxonomy."
        />

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <div
            className="rounded-3xl p-6 relative overflow-hidden border border-border bg-surface" style={{ backdropFilter: 'blur(24px)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-bold">Coverage</p>
                <h3 className="text-3xl font-black text-text-primary mt-1">{coveragePercent.toFixed(1)}%</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-4 w-full bg-surface-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-green-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-3xl p-6 border border-border bg-surface" style={{ backdropFilter: 'blur(24px)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-bold">Mapped Categories</p>
                <h3 className="text-3xl font-black text-text-primary mt-1">{coverageData.mappedCount}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <CheckCircle size={20} />
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3">Successfully linked to canonical tree</p>
          </div>

          <div
            className="rounded-3xl p-6 border border-border bg-surface" style={{ backdropFilter: 'blur(24px)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-bold">Unmapped Legacy</p>
                <h3 className="text-3xl font-black text-text-primary mt-1">{coverageData.unmappedOldCount}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
                <AlertTriangle size={20} />
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3">Legacy categories missing catalog target</p>
          </div>

          <div
            className="rounded-3xl p-6 border border-border bg-surface" style={{ backdropFilter: 'blur(24px)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider font-bold">Total Legacy</p>
                <h3 className="text-3xl font-black text-text-primary mt-1">{coverageData.totalOld}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-surface text-text-secondary">
                <FolderTree size={20} />
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-3">Total registered legacy categories</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 mb-6">
          <Tabs tabs={[
            { value: 'mapped', label: `Mapped Links (${coverageData.mappedCount})` },
            { value: 'unmapped', label: `Unmapped Left (${coverageData.unmappedOldCount})` },
          ]} value={activeTab} onChange={(v) => setActiveTab(v as 'mapped' | 'unmapped')} className="surface-card p-1 w-full sm:w-auto" />

          {/* Search & Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-col sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search name/slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full surface-card py-2 pl-9 pr-4 text-xs text-white placeholder-white/30 backdrop-blur-xl focus:border-accent-500/30 focus:outline-none"
              />
            </div>

            {activeTab === 'unmapped' && (
              <button
                onClick={handleExportUnmapped}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-secondary hover:bg-surface-secondary px-4 py-2 text-xs font-semibold text-text-primary border border-border transition-all w-full sm:w-auto"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Table/List Area */}
        <div
          className="rounded-3xl overflow-hidden border border-border bg-surface" style={{ backdropFilter: 'blur(24px)' }}
        >
          {activeTab === 'mapped' ? (
            <Table>
              <THead><TR>
                <TH>Legacy Category (Source)</TH>
                <TH>Catalog Category (Target)</TH>
                <TH>Slug</TH>
                <TH className="text-right">Action</TH>
              </TR></THead>
              <TBody>
                {filteredMapped.length === 0 ? (
                  <TR><TD colSpan={4} className="py-12 text-center text-white/40">No category mapping links match your query.</TD></TR>
                ) : (
                  filteredMapped.map((row) => (
                    <TR key={row.oldId}>
                      <TD>
                        <div>
                          <span className="font-semibold text-white">{row.oldName}</span>
                          <span className="block text-[10px] text-white/30 font-mono mt-0.5">{row.oldId}</span>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                          <div>
                            <span className="font-semibold text-white">{row.catalogName}</span>
                            <span className="block text-[10px] text-white/30 font-mono mt-0.5">{row.catalogId}</span>
                          </div>
                        </div>
                      </TD>
                      <TD className="font-mono text-xs text-white/50">{row.oldSlug}</TD>
                      <TD className="text-right">
                        <Link href={`/products?category=${row.oldSlug}`} className="inline-flex items-center gap-1 text-xs text-accent-500 hover:underline">
                          Browse Products <ExternalLink size={12} />
                        </Link>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          ) : (
            <Table>
              <THead><TR>
                <TH>Legacy Category</TH>
                <TH>Slug</TH>
                <TH>Reason / Status</TH>
                <TH className="text-right">Auto Suggestion</TH>
              </TR></THead>
              <TBody>
                {filteredUnmapped.length === 0 ? (
                  <TR><TD colSpan={4} className="py-12 text-center text-white/40">No unmapped legacy categories match your query.</TD></TR>
                ) : (
                  filteredUnmapped.map((row) => (
                    <TR key={row.oldId}>
                      <TD>
                        <div>
                          <span className="font-semibold text-white">{row.oldName}</span>
                          <span className="block text-[10px] text-white/30 font-mono mt-0.5">{row.oldId}</span>
                        </div>
                      </TD>
                      <TD className="font-mono text-xs text-white/50">{row.oldSlug}</TD>
                      <TD><Badge variant="warning">Unmapped</Badge></TD>
                      <TD className="text-right font-semibold text-white/40 text-xs">Pending Curation</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
