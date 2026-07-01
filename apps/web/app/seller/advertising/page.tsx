'use client';

import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyAds, useMyAdStats, usePauseAd, useResumeAd, useStopAd } from '@/hooks/use-advertising';
import { Plus, Play, Pause, Square, Eye, TrendingUp, MousePointerClick, DollarSign, Megaphone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

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

export default function SellerAdvertisingPage() {
  const [page, setPage] = useState(1);
  const { data: adsData, isLoading, error } = useMyAds({ page, limit: 20 });
  const { data: stats, isLoading: statsLoading } = useMyAdStats();
  const pauseMutation = usePauseAd();
  const resumeMutation = useResumeAd();
  const stopMutation = useStopAd();
  const [actionId, setActionId] = useState<string | null>(null);

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

  const handleStop = async (id: string) => {
    setActionId(id);
    try { await stopMutation.mutateAsync(id); toast({ title: 'Advertisement stopped' }); }
    catch { toast({ title: 'Failed to stop', variant: 'destructive' }); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Advertising" description="Manage your ad campaigns" actions={
        <Link href="/seller/advertising/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
        </Link>
      } />

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Megaphone} label="Total Campaigns" value={String(stats.total)} />
          <StatCard icon={Play} label="Active" value={String(stats.active)} />
          <StatCard icon={Eye} label="Impressions" value={stats.totalImpressions.toLocaleString()} />
          <StatCard icon={MousePointerClick} label="Clicks" value={stats.totalClicks.toLocaleString()} />
          <StatCard icon={DollarSign} label="Total Spend" value={`₹${stats.totalSpend.toLocaleString()}`} />
          <StatCard icon={TrendingUp} label="CTR" value={`${stats.ctr}%`} />
          <StatCard icon={Pause} label="Paused" value={String(stats.paused)} />
          <StatCard icon={Square} label="Completed" value={String(stats.completed)} />
        </div>
      ) : null}

      <Card>
        <CardHeader><CardTitle>My Campaigns</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : error ? (
            <div className="text-center py-8 text-red-400">Failed to load campaigns</div>
          ) : !adsData?.data.length ? (
            <div className="text-center py-8 text-gray-500">
              <Megaphone className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">No advertising campaigns yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first campaign to start promoting your business</p>
              <Link href="/seller/advertising/new">
                <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Budget</th>
                    <th className="pb-3 pr-4">Spent</th>
                    <th className="pb-3 pr-4">Impressions</th>
                    <th className="pb-3 pr-4">Clicks</th>
                    <th className="pb-3 pr-4">Actions</th>
                  </tr></thead>
                  <tbody>
                    {adsData.data.map(ad => (
                      <tr key={ad.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 pr-4">
                          <Link href={`/seller/advertising/${ad.id}`} className="text-blue-400 hover:underline">
                            {ad.title || AD_TYPE_LABELS[ad.type] || ad.type}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{AD_TYPE_LABELS[ad.type] || ad.type}</td>
                        <td className="py-3 pr-4"><Badge className={STATUS_STYLES[ad.status]}>{ad.status.replace('_', ' ')}</Badge></td>
                        <td className="py-3 pr-4">₹{Number(ad.totalBudget).toLocaleString()}</td>
                        <td className="py-3 pr-4">₹{Number(ad.spentBudget).toLocaleString()}</td>
                        <td className="py-3 pr-4">{ad.impressions.toLocaleString()}</td>
                        <td className="py-3 pr-4">{ad.clicks.toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
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
                            {(ad.status === 'ACTIVE' || ad.status === 'PAUSED') && (
                              <button onClick={() => handleStop(ad.id)} disabled={actionId === ad.id} className="p-1.5 hover:bg-gray-700 rounded" title="Stop">
                                <Square className="h-4 w-4" />
                              </button>
                            )}
                            <Link href={`/seller/advertising/${ad.id}`} className="p-1.5 hover:bg-gray-700 rounded" title="View">
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
