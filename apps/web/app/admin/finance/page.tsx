'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Clock, RefreshCw, AlertTriangle, FileText, Download, Search, Calendar, Shield, CreditCard, PieChart, ArrowUpDown, CheckCircle, XCircle, HelpCircle, Ban, Eye, Filter, List } from 'lucide-react';
import { useFinanceOpsDashboard, useRevenueAnalytics, useSettlements, useRefundList, useDisputeList, useCommissionSummary, useReconciliation, useSearchFinance } from '@/hooks/use-finance';
import { toast } from '@/components/ui/use-toast';
import * as financeApi from '@/lib/api/finance';

type TabId = 'overview' | 'revenue' | 'settlements' | 'refunds' | 'disputes' | 'commissions' | 'reconciliation' | 'search';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: DollarSign },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'settlements', label: 'Settlements', icon: Wallet },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'commissions', label: 'Commissions', icon: PieChart },
  { id: 'reconciliation', label: 'Reconciliation', icon: ArrowUpDown },
  { id: 'search', label: 'Search', icon: Search },
];

const STATUS_BADGE: Record<string, { variant: string; label: string }> = {
  PENDING: { variant: 'outline', label: 'Pending' },
  PROCESSING: { variant: 'outline', label: 'Processing' },
  PROCESSED: { variant: 'default', label: 'Processed' },
  COMPLETED: { variant: 'default', label: 'Completed' },
  FAILED: { variant: 'destructive', label: 'Failed' },
  PAUSED: { variant: 'secondary', label: 'Paused' },
  CANCELLED: { variant: 'secondary', label: 'Cancelled' },
  OPEN: { variant: 'destructive', label: 'Open' },
  UNDER_REVIEW: { variant: 'outline', label: 'Under Review' },
  RESOLVED: { variant: 'default', label: 'Resolved' },
  REFUNDED: { variant: 'default', label: 'Refunded' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
  APPROVED: { variant: 'default', label: 'Approved' },
  HELD: { variant: 'outline', label: 'Held' },
  FROZEN: { variant: 'secondary', label: 'Frozen' },
  DISPUTED: { variant: 'destructive', label: 'Disputed' },
  RELEASED: { variant: 'default', label: 'Released' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { variant: 'outline', label: status };
  return <Badge variant={cfg.variant as any}>{cfg.label}</Badge>;
}

function Pagination({ meta, onPage }: { meta: any; onPage: (page: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-text-secondary">
      <span>Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!meta.hasPrevious} onClick={() => onPage(meta.page - 1)}>Prev</Button>
        <Button size="sm" variant="outline" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [settlementPage, setSettlementPage] = useState(1);
  const [settlementStatus, setSettlementStatus] = useState('');
  const [refundPage, setRefundPage] = useState(1);
  const [refundStatus, setRefundStatus] = useState('');
  const [disputePage, setDisputePage] = useState(1);
  const [disputeStatus, setDisputeStatus] = useState('');
  const [reconPage, setReconPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState('');

  const { data: dashData, isLoading: dashLoading } = useFinanceOpsDashboard() as any;
  const { data: revData, isLoading: revLoading } = useRevenueAnalytics() as any;
  const { data: settlements, isLoading: setLoading } = useSettlements({ page: settlementPage, limit: 15, status: settlementStatus || undefined }) as any;
  const { data: refunds, isLoading: refLoading } = useRefundList({ page: refundPage, limit: 15, status: refundStatus || undefined }) as any;
  const { data: disputes, isLoading: disLoading } = useDisputeList({ page: disputePage, limit: 15, status: disputeStatus || undefined }) as any;
  const { data: commissions, isLoading: comLoading } = useCommissionSummary() as any;
  const { data: reconciliation, isLoading: recLoading } = useReconciliation({ page: reconPage, limit: 15 }) as any;
  const { data: searchResults, isLoading: searchLoading } = useSearchFinance(searchQuery) as any;

  const handleExport = async (entity: string) => {
    setExporting(entity);
    try {
      const res = await financeApi.exportFinanceData(entity);
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${entity}-export.csv`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${entity} exported` });
    } catch { toast({ title: 'Export failed', variant: 'destructive' }); }
    finally { setExporting(''); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Finance Operations" description="Full finance operations dashboard" actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={exporting === 'settlements'} onClick={() => handleExport('settlements')}>
            {exporting === 'settlements' ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />} Export Settlements
          </Button>
          <Button size="sm" variant="outline" disabled={exporting === 'refunds'} onClick={() => handleExport('refunds')}>
            {exporting === 'refunds' ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />} Export Refunds
          </Button>
          <Button size="sm" variant="outline" disabled={exporting === 'disputes'} onClick={() => handleExport('disputes')}>
            {exporting === 'disputes' ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />} Export Disputes
          </Button>
        </div>
      } />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg transition-colors ${tab === t.id ? 'bg-surface text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW === */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {dashLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
          ) : dashData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={`₹${(dashData.totalRevenue ?? 0).toLocaleString()}`} />
                <StatCard icon={TrendingUp} label="Today's Revenue" value={`₹${(dashData.todayRevenue ?? 0).toLocaleString()}`} />
                <StatCard icon={Clock} label="Pending Settlements" value={String(dashData.pendingSettlements ?? 0)} />
                <StatCard icon={Wallet} label="Escrow Balance" value={`₹${(dashData.escrowBalance ?? 0).toLocaleString()}`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={PieChart} label="Commission Earned" value={`₹${(dashData.commissionEarned ?? 0).toLocaleString()}`} />
                <StatCard icon={RefreshCw} label="Refund Queue" value={String(dashData.refundQueue ?? 0)} />
                <StatCard icon={AlertTriangle} label="Active Disputes" value={String(dashData.activeDisputes ?? 0)} />
                <StatCard icon={XCircle} label="Failed Settlements" value={String(dashData.failedSettlements ?? 0)} />
              </div>
            </>
          ) : <EmptyState title="No dashboard data" />}
        </div>
      )}

      {/* === REVENUE === */}
      {tab === 'revenue' && (
        <Card>
          <CardHeader><CardTitle>Revenue Analytics</CardTitle></CardHeader>
          <CardContent>
            {revLoading ? <TableSkeleton rows={6} /> : !revData?.length ? <EmptyState title="No revenue data" /> : (
              <div className="space-y-2">
                {revData.map((m: any) => {
                  const maxRev = Math.max(...revData.map((x: any) => x.revenue ?? x.monthlyRevenue ?? 0), 1);
                  const rev = m.revenue ?? m.monthlyRevenue ?? 0;
                  const label = m.month ?? m.date ?? m.weekStart ?? '?';
                  const pct = (rev / maxRev) * 100;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-text-tertiary w-20 shrink-0">{label}</span>
                      <div className="flex-1 h-5 bg-surface rounded overflow-hidden">
                        <div className="h-full bg-accent/60 rounded transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-text-secondary w-24 text-right">₹{rev.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === SETTLEMENTS === */}
      {tab === 'settlements' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Settlement Workspace</CardTitle>
              <div className="flex gap-2">
                {['', 'PENDING', 'PROCESSING', 'PAUSED', 'PROCESSED', 'FAILED'].map((s) => (
                  <button key={s} onClick={() => { setSettlementStatus(s); setSettlementPage(1); }} className={`px-3 py-1 text-xs rounded-full ${settlementStatus === s ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {setLoading ? <TableSkeleton rows={10} /> : !settlements?.data?.length ? <EmptyState title="No settlements" /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-text-tertiary">
                      <th className="pb-2 pr-4">ID</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Amount</th>
                      <th className="pb-2 pr-4">Commission</th>
                      <th className="pb-2 pr-4">Booking</th>
                      <th className="pb-2 pr-4">Date</th>
                    </tr></thead>
                    <tbody>
                      {settlements.data.map((s: any) => (
                        <tr key={s.id} className="border-b border-border">
                          <td className="py-2 pr-4 text-text-secondary font-mono text-[11px]">{s.id.slice(0, 8)}...</td>
                          <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                          <td className="py-2 pr-4">₹{s.amount.toLocaleString()}</td>
                          <td className="py-2 pr-4">₹{s.commissionAmount.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-text-secondary">{s.bookingId ? s.bookingId.slice(0, 8) : '-'}</td>
                          <td className="py-2 pr-4 text-text-secondary text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination meta={settlements.meta} onPage={setSettlementPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* === REFUNDS === */}
      {tab === 'refunds' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Refund Workspace</CardTitle>
              <div className="flex gap-2">
                {['', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'REFUNDED'].map((s) => (
                  <button key={s} onClick={() => { setRefundStatus(s); setRefundPage(1); }} className={`px-3 py-1 text-xs rounded-full ${refundStatus === s ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {refLoading ? <TableSkeleton rows={10} /> : !refunds?.data?.length ? <EmptyState title="No refunds" /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-text-tertiary">
                      <th className="pb-2 pr-4">ID</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Amount</th>
                      <th className="pb-2 pr-4">Reason</th>
                      <th className="pb-2 pr-4">Gateway ID</th>
                      <th className="pb-2 pr-4">Date</th>
                    </tr></thead>
                    <tbody>
                      {refunds.data.map((r: any) => (
                        <tr key={r.id} className="border-b border-border">
                          <td className="py-2 pr-4 text-text-secondary font-mono text-[11px]">{r.id.slice(0, 8)}...</td>
                          <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                          <td className="py-2 pr-4">₹{r.amount.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-text-secondary text-xs max-w-[200px] truncate">{r.reason || '-'}</td>
                          <td className="py-2 pr-4 text-text-secondary font-mono text-[11px]">{r.gatewayRefundId?.slice(0, 12) ?? '-'}</td>
                          <td className="py-2 pr-4 text-text-secondary text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination meta={refunds.meta} onPage={setRefundPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* === DISPUTES === */}
      {tab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['', 'OPEN', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'NEGOTIATION', 'RESOLVED', 'REFUNDED', 'CANCELLED'].map((s) => (
              <button key={s} onClick={() => { setDisputeStatus(s); setDisputePage(1); }} className={`px-3 py-1 text-xs rounded-full ${disputeStatus === s ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
          {disLoading ? <TableSkeleton rows={10} /> : !disputes?.data?.length ? <EmptyState title="No disputes" /> : (
            <div className="space-y-3">
              {disputes.data.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-text-tertiary">{d.disputeNumber}</span>
                          <StatusBadge status={d.status} />
                          <Badge variant="outline">{d.type}</Badge>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{d.reason} — {d.raisedBy} vs {d.against}</p>
                      </div>
                      {d.amount && <span className="text-sm font-bold">₹{d.amount.toLocaleString()}</span>}
                    </div>
                    {/* Timeline */}
                    {d.timeline?.length > 0 && (
                      <div className="border-t border-border pt-3 mt-2">
                        <p className="text-xs text-text-tertiary mb-2">Timeline</p>
                        <div className="space-y-1">
                          {d.timeline.slice(-5).map((t: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-text-tertiary">{new Date(t.createdAt).toLocaleDateString()}</span>
                              <span className="text-text-secondary">{t.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {d.resolution && (
                      <div className="border-t border-border pt-2 mt-2 text-xs">
                        <span className="text-text-tertiary">Resolution: </span>
                        <span className="text-text-primary">{d.resolution.type}</span>
                        {d.resolution.description && <span className="text-text-secondary"> — {d.resolution.description}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Pagination meta={disputes.meta} onPage={setDisputePage} />
            </div>
          )}
        </div>
      )}

      {/* === COMMISSIONS === */}
      {tab === 'commissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Commission Summary</CardTitle></CardHeader>
            <CardContent>
              {comLoading ? <TableSkeleton rows={3} /> : !commissions ? <EmptyState title="No commission data" /> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-surface rounded-lg">
                      <p className="text-xs text-text-tertiary">Total Commissions</p>
                      <p className="text-xl font-bold">{commissions.totalCommissions}</p>
                    </div>
                    <div className="p-4 bg-surface rounded-lg">
                      <p className="text-xs text-text-tertiary">Platform Revenue</p>
                      <p className="text-xl font-bold">₹{commissions.totalPlatformRevenue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-surface rounded-lg">
                      <p className="text-xs text-text-tertiary">Active Rules</p>
                      <p className="text-xl font-bold">{commissions.activeRules}</p>
                    </div>
                  </div>
                  {commissions.monthlyTrend?.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-text-tertiary mb-2">Monthly Commission Trend</p>
                      <div className="space-y-1">
                        {commissions.monthlyTrend.map((m: any) => (
                          <div key={m.month} className="flex items-center gap-2 text-xs">
                            <span className="text-text-secondary w-16">{m.month}</span>
                            <div className="flex-1 h-3 bg-surface rounded overflow-hidden">
                              <div className="h-full bg-accent/40 rounded" style={{ width: `${Math.min(100, (m.amount / Math.max(...commissions.monthlyTrend.map((x: any) => x.amount), 1)) * 100)}%` }} />
                            </div>
                            <span className="text-text-secondary w-20 text-right">₹{m.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Applied Rules</CardTitle></CardHeader>
            <CardContent>
              {comLoading ? <TableSkeleton rows={5} /> : !commissions?.rules?.length ? <EmptyState title="No rules" /> : (
                <div className="space-y-2">
                  {commissions.rules.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{r.name || 'Unnamed'}</p>
                        <p className="text-xs text-text-tertiary">{r.ruleType} · {r.calcType} · Priority {r.priority}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{r.calcType === 'PERCENTAGE' ? `${r.percent}%` : `₹${r.fixedFee}`}</p>
                        <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* === RECONCILIATION === */}
      {tab === 'reconciliation' && (
        <Card>
          <CardHeader><CardTitle>Financial Reconciliation</CardTitle></CardHeader>
          <CardContent>
            {recLoading ? <TableSkeleton rows={8} /> : !reconciliation?.data?.length ? <EmptyState title="No reconciliation data" /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-text-tertiary">
                      <th className="pb-2 pr-3">Booking</th>
                      <th className="pb-2 pr-3">Gateway</th>
                      <th className="pb-2 pr-3">Escrow</th>
                      <th className="pb-2 pr-3">Commission</th>
                      <th className="pb-2 pr-3">Expected</th>
                      <th className="pb-2 pr-3">Settled</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">Match</th>
                    </tr></thead>
                    <tbody>
                      {reconciliation.data.map((r: any) => (
                        <tr key={r.bookingId} className={`border-b border-border ${!r.isMatched ? 'bg-status-error/5' : ''}`}>
                          <td className="py-2 pr-3 font-mono text-[11px] text-text-secondary">{r.bookingId?.slice(0, 8)}</td>
                          <td className="py-2 pr-3">₹{r.gatewayAmount.toLocaleString()}</td>
                          <td className="py-2 pr-3">₹{r.escrowAmount.toLocaleString()}</td>
                          <td className="py-2 pr-3">₹{r.commissionAmount.toLocaleString()}</td>
                          <td className="py-2 pr-3">₹{r.expectedSettlement.toLocaleString()}</td>
                          <td className="py-2 pr-3">₹{r.actualSettlement.toLocaleString()}</td>
                          <td className="py-2 pr-3"><StatusBadge status={r.settlementStatus} /></td>
                          <td className="py-2 pr-3">{r.isMatched ? <CheckCircle className="h-4 w-4 text-status-success" /> : <XCircle className="h-4 w-4 text-status-error" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination meta={reconciliation.meta} onPage={setReconPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* === SEARCH === */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input type="text" placeholder="Search by Settlement ID, Refund ID, Dispute Number, Booking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          {searchLoading ? <LoadingSpinner /> : !searchQuery ? <EmptyState title="Enter a search term" description="Minimum 2 characters" /> : searchResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {searchResults.settlements?.length > 0 && (
                <Card><CardHeader><CardTitle className="text-sm">Settlements</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {searchResults.settlements.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2 bg-surface rounded"><span className="text-xs font-mono text-text-secondary">{s.id.slice(0, 12)}...</span><StatusBadge status={s.status} /><span className="text-xs">₹{s.amount.toLocaleString()}</span></div>
                    ))}
                  </CardContent></Card>
              )}
              {searchResults.refunds?.length > 0 && (
                <Card><CardHeader><CardTitle className="text-sm">Refunds</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {searchResults.refunds.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-2 bg-surface rounded"><span className="text-xs font-mono text-text-secondary">{r.id.slice(0, 12)}...</span><StatusBadge status={r.status} /><span className="text-xs">₹{r.amount.toLocaleString()}</span></div>
                    ))}
                  </CardContent></Card>
              )}
              {searchResults.disputes?.length > 0 && (
                <Card><CardHeader><CardTitle className="text-sm">Disputes</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {searchResults.disputes.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-2 bg-surface rounded"><span className="text-xs">{d.disputeNumber}</span><StatusBadge status={d.status} /></div>
                    ))}
                  </CardContent></Card>
              )}
              {searchResults.escrows?.length > 0 && (
                <Card><CardHeader><CardTitle className="text-sm">Escrows</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {searchResults.escrows.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-2 bg-surface rounded"><span className="text-xs font-mono text-text-secondary">{e.bookingId?.slice(0, 8) ?? '-'}</span><StatusBadge status={e.status} /><span className="text-xs">₹{e.amount.toLocaleString()}</span></div>
                    ))}
                  </CardContent></Card>
              )}
              {!searchResults.settlements?.length && !searchResults.refunds?.length && !searchResults.disputes?.length && !searchResults.escrows?.length && (
                <div className="col-span-2"><EmptyState title="No results" /></div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
