'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { useAdminAds, useAdminAdDashboard, useApproveAd, useRejectAd, useAdminPauseAd, useAdminResumeAd } from '@/hooks/use-advertising';
import { toast } from '@/components/ui/use-toast';
import { Eye, Play, Pause, CheckCircle, XCircle, Search, Megaphone, DollarSign, TrendingUp, MousePointerClick } from 'lucide-react';
import type { AdStatus, AdType } from '@/lib/api/advertising';

const AD_TYPE_LABELS: Record<string, string> = {
  SPONSORED_PRODUCT: 'Sponsored Product',
  SPONSORED_COMPANY: 'Sponsored Company',
  SPONSORED_CATEGORY: 'Sponsored Category',
  HOMEPAGE_BANNER: 'Homepage Banner',
  CATEGORY_BANNER: 'Category Banner',
  SEARCH_KEYWORD_AD: 'Search Keyword Ad',
  CITY_PROMOTION: 'City Promotion',
  FEATURED_SELLER: 'Featured Seller',
  FEATURED_BRAND: 'Featured Brand',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-surface/20 text-text-tertiary',
  PENDING_REVIEW: 'bg-status-warning/20 text-status-warning',
  ACTIVE: 'bg-status-success/20 text-status-success',
  PAUSED: 'bg-status-info/20 text-status-info',
  EXPIRED: 'bg-status-error/20 text-status-error',
  CANCELLED: 'bg-surface/20 text-text-tertiary',
  REJECTED: 'bg-status-error/20 text-status-error',
  COMPLETED: 'bg-accent/20 text-accent',
};

export default function AdminAdvertisingPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AdStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<AdType | ''>('');
  const [search, setSearch] = useState('');

  const { data: dashboard, isLoading: dashLoading } = useAdminAdDashboard();
  const { data: adsData, isLoading, error } = useAdminAds({ page, limit: 20, search, status: statusFilter || undefined, type: typeFilter || undefined });
  const approveMutation = useApproveAd();
  const rejectMutation = useRejectAd();
  const pauseMutation = useAdminPauseAd();
  const resumeMutation = useAdminResumeAd();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try { await approveMutation.mutateAsync(id); toast({ title: 'Advertisement approved' }); }
    catch { toast({ title: 'Failed to approve', variant: 'destructive' }); }
    finally { setActionId(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setActionId(id);
    try { await rejectMutation.mutateAsync({ id, reason }); toast({ title: 'Advertisement rejected' }); }
    catch { toast({ title: 'Failed to reject', variant: 'destructive' }); }
    finally { setActionId(null); }
  };

  const handlePause = async (id: string) => {
    setActionId(id);
    try { await pauseMutation.mutateAsync(id); toast({ title: 'Advertisement paused' }); }
    catch { toast({ title: 'Failed to pause', variant: 'destructive' }); }
    finally { setActionId(null); }
  };

  const handleResume = async (id: string) => {
    setActionId(id);
    try { await resumeMutation.mutateAsync(id); toast({ title: 'Advertisement resumed' }); }
    catch { toast({ title: 'Failed to resume', variant: 'destructive' }); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Advertising" description="Manage all advertising campaigns" />

      {dashLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={Megaphone} label="Total Campaigns" value={String(dashboard.total)} />
            <StatCard icon={Play} label="Active" value={String(dashboard.active)} />
            <StatCard icon={Eye} label="Pending Review" value={String(dashboard.pending)} />
            <StatCard icon={Pause} label="Paused" value={String(dashboard.paused)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Spend" value={`₹${dashboard.totalSpend.toLocaleString()}`} />
            <StatCard icon={Eye} label="Total Impressions" value={dashboard.totalImpressions.toLocaleString()} />
            <StatCard icon={MousePointerClick} label="Total Clicks" value={dashboard.totalClicks.toLocaleString()} />
            <StatCard icon={TrendingUp} label="CTR" value={dashboard.totalImpressions > 0 ? `${((dashboard.totalClicks / dashboard.totalImpressions) * 100).toFixed(2)}%` : '0%'} />
          </div>
          {dashboard.byType.length > 0 && (
            <Card>
              <CardHeader><CardTitle>By Type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {dashboard.byType.map(t => (
                    <div key={t.type} className="bg-surface rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-text-primary">{t.count}</div>
                      <div className="text-xs text-text-tertiary">{AD_TYPE_LABELS[t.type] || t.type}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <CardTitle>All Campaigns</CardTitle>
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-48" />
              </div>
              <Select className="w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as AdStatus | ''); setPage(1); }}>
                <option value="">All status</option>
                <option value="PENDING_REVIEW">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="COMPLETED">Completed</option>
              </Select>
              <Select className="w-40" value={typeFilter} onChange={e => { setTypeFilter(e.target.value as AdType | ''); setPage(1); }}>
                <option value="">All types</option>
                {Object.entries(AD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : error ? (
            <div className="text-center py-8 text-status-error">Failed to load campaigns</div>
          ) : !adsData?.data.length ? (
            <EmptyState icon={Megaphone} title="No campaigns found" />
          ) : (
            <>
              <Table>
                <THead><TR>
                  <TH>Company</TH>
                  <TH>Title</TH>
                  <TH>Type</TH>
                  <TH>Status</TH>
                  <TH>Budget</TH>
                  <TH>Spent</TH>
                  <TH>Impressions</TH>
                  <TH>Actions</TH>
                </TR></THead>
                <TBody>
                  {adsData.data.map(ad => (
                    <TR key={ad.id}>
                      <TD className="text-text-secondary">{ad.company?.name || 'N/A'}</TD>
                      <TD>
                        <Link href={`/admin/advertising/${ad.id}`} className="text-accent hover:underline">
                          {ad.title || AD_TYPE_LABELS[ad.type] || ad.type}
                        </Link>
                      </TD>
                      <TD>{AD_TYPE_LABELS[ad.type] || ad.type}</TD>
                      <TD><Badge className={STATUS_STYLES[ad.status]}>{ad.status.replace('_', ' ')}</Badge></TD>
                      <TD>₹{Number(ad.totalBudget).toLocaleString()}</TD>
                      <TD>₹{Number(ad.spentBudget).toLocaleString()}</TD>
                      <TD>{ad.impressions.toLocaleString()}</TD>
                      <TD>
                        <div className="flex gap-1">
                          {ad.status === 'PENDING_REVIEW' && (
                            <>
                              <button onClick={() => handleApprove(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-status-success/20 rounded text-status-success" title="Approve">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleReject(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-status-error/20 rounded text-status-error" title="Reject">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {ad.status === 'ACTIVE' && (
                            <button onClick={() => handlePause(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-surface rounded text-text-secondary" title="Pause">
                              <Pause className="h-4 w-4" />
                            </button>
                          )}
                          {ad.status === 'PAUSED' && (
                            <button onClick={() => handleResume(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-surface rounded text-text-secondary" title="Resume">
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <Link href={`/admin/advertising/${ad.id}`} className="p-1.5 hover:bg-surface rounded text-text-secondary" title="View">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {adsData.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={!adsData.meta.hasPrevious} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="flex items-center text-sm text-text-tertiary">Page {adsData.meta.page} of {adsData.meta.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={!adsData.meta.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
