'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardPageHeader,
  StatCard,
  StatusBadge,
  TableSkeleton,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Package,
  Layers,
  Grid3X3,
  Wrench,
  Search,
  Play,
  RotateCcw,
  Undo2,
  Eye,
  ChevronDown,
  ChevronRight,
  X,
  Upload,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  getImportStats,
  getImportJobs,
  getImportJob,
  startImport,
  rollbackImport,
  retryImport,
  searchCatalog,
  type ImportStatsResponse,
  type ImportJobResponse,
  type ImportJobRowResponse,
  type ImportJobType,
} from '@/lib/api/catalog-import';

const jobStatusStyles: Record<string, string> = {
  pending: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary',
  running: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
  failed: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  partial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  rolling_back: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  rolled_back: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary',
};

const rowStatusStyles: Record<string, string> = {
  pending: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary',
  valid: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  invalid: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  imported: 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400',
  skipped: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  duplicate: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  rolled_back: 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary',
};

const importTypeLabels: Record<string, string> = {
  CATEGORY: 'Category',
  SUBCATEGORY: 'Subcategory',
  PRODUCT_MASTER: 'Product Master',
  SERVICE_MASTER: 'Service Master',
  ALL: 'All Types',
};

function JobStatusBadge({ status }: { status: string }) {
  const style = jobStatusStyles[status.toLowerCase()] || 'bg-surface-secondary text-text-secondary';
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: style.split(' ')[0], color: style.split(' ')[2] }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function RowStatusIndicator({ status }: { status: string }) {
  const style = rowStatusStyles[status.toLowerCase()] || 'bg-surface-secondary text-text-secondary';
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: style.split(' ')[0], color: style.split(' ')[2] }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.split(' ')[2] }} />
      {status}
    </span>
  );
}

export default function CatalogImportPage() {
  const { toast: showToast, toasts } = useToast();
  const [stats, setStats] = useState<ImportStatsResponse | null>(null);
  const [jobs, setJobs] = useState<ImportJobResponse[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobRows, setJobRows] = useState<Record<string, ImportJobRowResponse[]>>({});
  const [rowsLoading, setRowsLoading] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importType, setImportType] = useState<ImportJobType | 'ALL'>('ALL');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    products: { id: string; name: string; slug: string; category: string | null; status: string; unit: string | null }[];
    services: { id: string; name: string; slug: string; category: string | null; status: string; unit: string | null }[];
    total: number;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getImportStats();
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getImportJobs(page, 20);
      setJobs(data.jobs);
      setJobsTotal(data.total);
    } catch {
      // silent
    } finally {
      setJobsLoading(false);
    }
  }, [page]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchJobs()]);
    setIsLoading(false);
  }, [fetchStats, fetchJobs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const hasRunningJob = jobs.some((j) => j.status === 'RUNNING' || j.status === 'ROLLING_BACK');

  useEffect(() => {
    if (!hasRunningJob) return;
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [hasRunningJob, fetchAll]);

  const toggleJobExpand = async (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    if (!jobRows[jobId]) {
      setRowsLoading(jobId);
      try {
        const job = await getImportJob(jobId);
        setJobRows((prev) => ({ ...prev, [jobId]: job.rows || [] }));
      } catch {
        setJobRows((prev) => ({ ...prev, [jobId]: [] }));
      } finally {
        setRowsLoading(null);
      }
    }
  };

  const handleStartImport = async () => {
    setImporting(true);
    try {
      let fileUrl: string | undefined;
      if (importFile) {
        const formData = new FormData();
        formData.append('file', importFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
      }
      await startImport({ type: importType, fileUrl });
      showToast({ title: 'Import started', description: `${importTypeLabels[importType]} import has been initiated.` });
      setShowImportDialog(false);
      setImportFile(null);
      fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start import';
      showToast({ title: 'Import failed', description: message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleRollback = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      await rollbackImport(jobId);
      showToast({ title: 'Rollback started', description: 'Import data is being rolled back.' });
      fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rollback failed';
      showToast({ title: 'Rollback failed', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      await retryImport(jobId);
      showToast({ title: 'Retry started', description: 'Import job is being retried.' });
      fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Retry failed';
      showToast({ title: 'Retry failed', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await searchCatalog({ q, limit: 20 });
      setSearchResults(data);
    } catch {
      setSearchResults({ products: [], services: [], total: 0 });
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) handleSearch();
      else setSearchResults(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Catalog Import" description="Import and manage catalog data" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Catalog Import"
        description="Import and manage catalog data"
        actions={
          <Button onClick={() => setShowImportDialog(true)}>
            <Play className="mr-2 h-4 w-4" />
            Start New Import
          </Button>
        }
      />

      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Grid3X3} label="Total Categories" value={String(stats.totalCategories)} change={stats.totalCategories > 0 ? `${stats.totalCategories}` : undefined} changeType={stats.totalCategories > 0 ? 'positive' : 'neutral'} />
          <StatCard icon={Layers} label="Subcategories" value={String(stats.totalSubcategories)} />
          <StatCard icon={Package} label="Products Master" value={String(stats.totalProducts)} />
          <StatCard icon={Wrench} label="Services Master" value={String(stats.totalServices)} />
          <StatCard icon={Database} label="Import Jobs" value={String(stats.totalJobs)} change={`${stats.completedJobs} done`} changeType={stats.failedJobs === 0 ? 'positive' : stats.failedJobs > 0 ? 'negative' : 'neutral'} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
        <div className="flex items-center gap-3 border-b border-border p-4 dark:border-dark-border">
          <Search className="h-4 w-4 text-text-tertiary" />
          <Input
            placeholder="Search products & services in catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}>
              <X className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
            </button>
          )}
        </div>
        {searching && (
          <div className="p-6 text-center text-sm text-text-secondary">
            Searching...
          </div>
        )}
        {searchResults && !searching && (
          <div className="divide-y divide-border dark:divide-dark-border">
            {searchResults.products.length === 0 && searchResults.services.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary">
                No results found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <>
                {searchResults.products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-text-tertiary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{p.name}</p>
                        <p className="text-xs text-text-secondary">{p.category} &middot; {p.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.unit && <span className="text-xs text-text-tertiary">{p.unit}</span>}
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
                {searchResults.services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-4 w-4 text-text-tertiary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{s.name}</p>
                        <p className="text-xs text-text-secondary">{s.category} &middot; {s.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.unit && <span className="text-xs text-text-tertiary">{s.unit}</span>}
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
        <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary lg:grid">
          <div className="col-span-1">Job ID</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Rows (T/V/I/Im)</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-4">Actions</div>
        </div>

        {jobsLoading ? (
          <TableSkeleton rows={5} />
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Database className="h-12 w-12 text-text-tertiary" />
            <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No import jobs yet</p>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
              Start a new import to populate the catalog.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setShowImportDialog(true)}>
              <Play className="mr-2 h-4 w-4" />
              Start New Import
            </Button>
          </div>
        ) : (
          <>
            {jobs.map((job) => (
              <div key={job.id}>
                <div className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 lg:grid-cols-12 lg:items-center dark:border-dark-border">
                  <div className="flex items-center gap-2 lg:col-span-1">
                    <button
                      onClick={() => toggleJobExpand(job.id)}
                      className="text-text-tertiary hover:text-text-primary"
                    >
                      {expandedJob === job.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-mono text-xs text-text-secondary">
                      {job.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="lg:col-span-1">
                    <span className="text-sm text-text-primary dark:text-dark-text-primary">
                      {importTypeLabels[job.type] || job.type}
                    </span>
                  </div>
                  <div className="lg:col-span-1">
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary lg:col-span-3">
                    <span>{job.totalRows}</span>
                    <span className="text-accent-600 font-medium">{job.validRows}</span>
                    <span className="text-red-600">{job.invalidRows}</span>
                    <span className="text-blue-600">{job.importedRows}</span>
                  </div>
                  <div className="text-sm text-text-secondary dark:text-dark-text-secondary lg:col-span-2">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleJobExpand(job.id)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Details
                    </Button>
                    {job.status === 'COMPLETED' && !job.rolledBackAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(job.id)}
                        disabled={actionLoading === job.id}
                      >
                        <Undo2 className="mr-1 h-3.5 w-3.5" />
                        {actionLoading === job.id ? 'Rolling back...' : 'Rollback'}
                      </Button>
                    )}
                    {(job.status === 'FAILED' || job.status === 'PARTIAL') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(job.id)}
                        disabled={actionLoading === job.id}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        {actionLoading === job.id ? 'Retrying...' : 'Retry'}
                      </Button>
                    )}
                  </div>
                </div>

                {expandedJob === job.id && (
                  <div className="border-b border-border bg-surface-secondary/50 px-6 py-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                        Row Breakdown
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>Total: <strong>{job.totalRows}</strong></span>
                        <span className="text-accent-600">Valid: {job.validRows}</span>
                        <span className="text-red-600">Invalid: {job.invalidRows}</span>
                        <span className="text-blue-600">Imported: {job.importedRows}</span>
                        <span className="text-amber-600">Skipped: {job.skippedRows}</span>
                        <span className="text-purple-600">Duplicates: {job.duplicateRows}</span>
                        <span className="text-red-600">Errors: {job.errorRows}</span>
                      </div>
                    </div>
                    {rowsLoading === job.id ? (
                      <p className="py-3 text-center text-sm text-text-secondary">Loading rows...</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {(jobRows[job.id] || []).length === 0 ? (
                          <p className="py-3 text-center text-sm text-text-secondary">No row data available.</p>
                        ) : (
                          <div className="grid grid-cols-8 gap-2 border-b border-border pb-2 text-xs font-medium uppercase text-text-secondary dark:border-dark-border">
                            <div className="col-span-1">Row</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-2">Entity</div>
                            <div className="col-span-2">Errors</div>
                            <div className="col-span-2">Warnings</div>
                          </div>
                        )}
                        {(jobRows[job.id] || []).map((row) => (
                          <div
                            key={row.id}
                            className="grid grid-cols-8 gap-2 border-b border-border py-2 text-sm last:border-0 dark:border-dark-border"
                          >
                            <div className="col-span-1 font-mono text-xs text-text-secondary">
                              {row.rowNumber}
                            </div>
                            <div className="col-span-1">
                              <RowStatusIndicator status={row.status} />
                            </div>
                            <div className="col-span-2 text-xs text-text-secondary">
                              {row.entityType || '-'}
                            </div>
                            <div className="col-span-2 text-xs text-red-600">
                              {row.errors.length > 0 ? row.errors.join('; ') : '-'}
                            </div>
                            <div className="col-span-2 text-xs text-amber-600">
                              {row.warnings.length > 0 ? row.warnings.join('; ') : '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {job.summary && (
                      <div className="mt-3 rounded-lg bg-surface p-3 dark:bg-dark-surface">
                        <p className="mb-1 text-xs font-medium text-text-secondary uppercase">Summary</p>
                        <pre className="text-xs text-text-primary whitespace-pre-wrap">
                          {JSON.stringify(job.summary, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {jobsTotal > 20 && (
              <div className="flex items-center justify-between px-6 py-3">
                <p className="text-sm text-text-secondary">
                  Showing {jobs.length} of {jobsTotal} jobs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={jobs.length < 20}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowImportDialog(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl dark:bg-dark-surface dark:border-dark-border">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">Start New Import</h2>
              <button onClick={() => setShowImportDialog(false)}>
                <X className="h-5 w-5 text-text-tertiary hover:text-text-primary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  Import Type
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as ImportJobType | 'ALL')}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-dark-surface dark:border-dark-border"
                >
                  <option value="ALL">All Types</option>
                  <option value="CATEGORY">Categories</option>
                  <option value="SUBCATEGORY">Subcategories</option>
                  <option value="PRODUCT_MASTER">Product Master</option>
                  <option value="SERVICE_MASTER">Service Master</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  File Upload <span className="text-text-tertiary">(optional)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-text-secondary hover:border-primary-500 hover:text-primary-600 dark:border-dark-border">
                  <Upload className="h-5 w-5" />
                  {importFile ? importFile.name : 'Upload CSV or JSON file'}
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </label>
                {importFile && (
                  <button
                    onClick={() => setImportFile(null)}
                    className="mt-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                )}
              </div>

              <div className="rounded-lg bg-surface-secondary p-3 text-xs text-text-secondary dark:bg-dark-surface-secondary">
                <AlertCircle className="mb-1 inline h-3.5 w-3.5" />
                {' '}If no file is provided, the system will use the pre-generated master catalog data.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStartImport} disabled={importing}>
                  {importing ? 'Starting...' : 'Start Import'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${
                t.variant === 'destructive'
                  ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-300'
              }`}
            >
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs opacity-80">{t.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
