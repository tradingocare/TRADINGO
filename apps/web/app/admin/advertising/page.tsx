'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DRAFT: 'bg-gray-500/20 text-gray-400',
  PENDING_REVIEW: 'bg-yellow-500/20 text-yellow-400',
  ACTIVE: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-red-500/20 text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  COMPLETED: 'bg-purple-500/20 text-purple-400',
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
                    <div key={t.type} className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold">{t.count}</div>
                      <div className="text-xs text-gray-400">{AD_TYPE_LABELS[t.type] || t.type}</div>
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
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-48" />
              </div>
              <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as AdStatus | ''); setPage(1); }}>
                <option value="">All status</option>
                <option value="PENDING_REVIEW">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-40" value={typeFilter} onChange={e => { setTypeFilter(e.target.value as AdType | ''); setPage(1); }}>
                <option value="">All types</option>
                {Object.entries(AD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : error ? (
            <div className="text-center py-8 text-red-400">Failed to load campaigns</div>
          ) : !adsData?.data.length ? (
            <div className="text-center py-8 text-gray-500">
              <Megaphone className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No campaigns found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="pb-3 pr-4">Company</th>
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Budget</th>
                    <th className="pb-3 pr-4">Spent</th>
                    <th className="pb-3 pr-4">Impressions</th>
                    <th className="pb-3 pr-4">Actions</th>
                  </tr></thead>
                  <tbody>
                    {adsData.data.map(ad => (
                      <tr key={ad.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 pr-4 text-gray-300">{ad.company?.name || 'N/A'}</td>
                        <td className="py-3 pr-4">
                          <Link href={`/admin/advertising/${ad.id}`} className="text-blue-400 hover:underline">
                            {ad.title || AD_TYPE_LABELS[ad.type] || ad.type}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{AD_TYPE_LABELS[ad.type] || ad.type}</td>
                        <td className="py-3 pr-4"><Badge className={STATUS_STYLES[ad.status]}>{ad.status.replace('_', ' ')}</Badge></td>
                        <td className="py-3 pr-4">₹{Number(ad.totalBudget).toLocaleString()}</td>
                        <td className="py-3 pr-4">₹{Number(ad.spentBudget).toLocaleString()}</td>
                        <td className="py-3 pr-4">{ad.impressions.toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            {ad.status === 'PENDING_REVIEW' && (
                              <>
                                <button onClick={() => handleApprove(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-green-900/30 rounded text-green-400" title="Approve">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleReject(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-red-900/30 rounded text-red-400" title="Reject">
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {ad.status === 'ACTIVE' && (
                              <button onClick={() => handlePause(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-gray-700 rounded" title="Pause">
                                <Pause className="h-4 w-4" />
                              </button>
                            )}
                            {ad.status === 'PAUSED' && (
                              <button onClick={() => handleResume(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-gray-700 rounded" title="Resume">
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            <Link href={`/admin/advertising/${ad.id}`} className="p-1.5 hover:bg-gray-700 rounded" title="View">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adsData.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={!adsData.meta.hasPrevious} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="flex items-center text-sm text-gray-400">Page {adsData.meta.page} of {adsData.meta.totalPages}</span>
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
