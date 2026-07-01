'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAd, useAdAnalytics, usePauseAd, useResumeAd, useStopAd, useFundAd } from '@/hooks/use-advertising';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Play, Pause, Square, Wallet, Eye, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

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

export default function AdDetailPage() {
  const params = useParams();
  const adId = params.id as string;
  const { data: ad, isLoading, error } = useAd(adId);
  const { data: analytics } = useAdAnalytics(adId);
  const pauseMutation = usePauseAd();
  const resumeMutation = useResumeAd();
  const stopMutation = useStopAd();
  const fundMutation = useFundAd();
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  const handlePause = async () => {
    try { await pauseMutation.mutateAsync(adId); toast({ title: 'Advertisement paused' }); }
    catch { toast({ title: 'Failed to pause', variant: 'destructive' }); }
  };

  const handleResume = async () => {
    try { await resumeMutation.mutateAsync(adId); toast({ title: 'Advertisement resumed' }); }
    catch { toast({ title: 'Failed to resume', variant: 'destructive' }); }
  };

  const handleStop = async () => {
    try { await stopMutation.mutateAsync(adId); toast({ title: 'Advertisement stopped' }); }
    catch { toast({ title: 'Failed to stop', variant: 'destructive' }); }
  };

  const handleFund = async () => {
    const amount = Number(fundAmount);
    if (!amount || amount <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    setFunding(true);
    try {
      await fundMutation.mutateAsync({ id: adId, amount });
      toast({ title: 'Budget added successfully' });
      setFundAmount('');
    } catch {
      toast({ title: 'Failed to add budget', variant: 'destructive' });
    } finally {
      setFunding(false);
    }
  };

  if (isLoading) return <div className="space-y-6"><DashboardPageHeader title="Loading..." /><TableSkeleton rows={5} /></div>;
  if (error || !ad) return (
    <div className="space-y-6">
      <DashboardPageHeader title="Advertisement" />
      <Card><CardContent className="py-12 text-center text-red-400">Failed to load advertisement</CardContent></Card>
    </div>
  );

  const summary = analytics?.summary;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={ad.title || AD_TYPE_LABELS[ad.type] || 'Advertisement'} actions={
        <Link href="/seller/advertising"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
      } />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Status</CardTitle></CardHeader>
          <CardContent><Badge className={STATUS_STYLES[ad.status]}>{ad.status.replace('_', ' ')}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Type</CardTitle></CardHeader>
          <CardContent className="font-medium">{AD_TYPE_LABELS[ad.type] || ad.type}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Pricing</CardTitle></CardHeader>
          <CardContent className="font-medium">{ad.pricingModel}{ad.cpc ? ` (₹${ad.cpc}/click)` : ad.cpm ? ` (₹${ad.cpm}/1K)` : ''}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Budget Usage</CardTitle></CardHeader>
          <CardContent className="font-medium">₹{Number(ad.spentBudget).toLocaleString()} / ₹{Number(ad.totalBudget).toLocaleString()}</CardContent></Card>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-1"><Eye className="h-3 w-3" /> Impressions</CardTitle></CardHeader>
            <CardContent className="text-lg font-bold">{summary.impressions.toLocaleString()}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> Clicks</CardTitle></CardHeader>
            <CardContent className="text-lg font-bold">{summary.clicks.toLocaleString()}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> CTR</CardTitle></CardHeader>
            <CardContent className="text-lg font-bold">{summary.ctr}%</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-1"><DollarSign className="h-3 w-3" /> CPC</CardTitle></CardHeader>
            <CardContent className="text-lg font-bold">₹{summary.cpc}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> ROI</CardTitle></CardHeader>
            <CardContent className="text-lg font-bold">{summary.roi}%</CardContent></Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Start</span><span>{new Date(ad.startDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">End</span><span>{new Date(ad.endDate).toLocaleDateString()}</span></div>
            {ad.description && <div className="flex justify-between"><span className="text-gray-400">Description</span><span className="text-right max-w-xs">{ad.description}</span></div>}
            {ad.targetUrl && <div className="flex justify-between"><span className="text-gray-400">Target URL</span><span className="text-right max-w-xs truncate">{ad.targetUrl}</span></div>}
            {ad.keyword && <div className="flex justify-between"><span className="text-gray-400">Keyword</span><span>{ad.keyword}</span></div>}
            {ad.city && <div className="flex justify-between"><span className="text-gray-400">City</span><span>{ad.city}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">Daily Budget</span><span>₹{Number(ad.dailyBudget).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Auto Pause</span><span>{ad.autoPause ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Auto Resume</span><span>{ad.autoResume ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Auto Stop</span><span>{ad.autoStop ? 'Yes' : 'No'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {ad.status === 'ACTIVE' && <Button onClick={handlePause} variant="outline"><Pause className="mr-2 h-4 w-4" /> Pause</Button>}
              {ad.status === 'PAUSED' && <Button onClick={handleResume} variant="outline"><Play className="mr-2 h-4 w-4" /> Resume</Button>}
              {(ad.status === 'ACTIVE' || ad.status === 'PAUSED') && <Button onClick={handleStop} variant="outline" className="text-red-400"><Square className="mr-2 h-4 w-4" /> Stop</Button>}
            </div>
            <div className="border-t border-gray-800 pt-4">
              <label className="text-sm text-gray-400 mb-2 block">Fund Campaign (GOCASH)</label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="Amount" />
                <Button onClick={handleFund} disabled={funding}><Wallet className="mr-2 h-4 w-4" />{funding ? 'Adding...' : 'Add Budget'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {ad.targets && ad.targets.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Targeting</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ad.targets.map(t => (
                <Badge key={t.id} className="bg-gray-800 text-gray-300">{t.targetType}: {t.targetValue}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics?.daily && analytics.daily.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Analytics</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800 text-left text-gray-400">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Impressions</th>
                  <th className="pb-3 pr-4">Clicks</th>
                  <th className="pb-3 pr-4">Spend</th>
                  <th className="pb-3 pr-4">Conversions</th>
                </tr></thead>
                <tbody>
                  {analytics.daily.map(d => (
                    <tr key={d.id} className="border-b border-gray-800/50">
                      <td className="py-3 pr-4">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">{d.impressions.toLocaleString()}</td>
                      <td className="py-3 pr-4">{d.clicks.toLocaleString()}</td>
                      <td className="py-3 pr-4">₹{Number(d.spend).toLocaleString()}</td>
                      <td className="py-3 pr-4">{d.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
