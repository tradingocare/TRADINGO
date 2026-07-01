'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminAd, useAdAnalytics, useApproveAd, useRejectAd, useAdminPauseAd, useAdminResumeAd } from '@/hooks/use-advertising';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Play, Pause, Eye, MousePointerClick, TrendingUp, DollarSign } from 'lucide-react';

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

export default function AdminAdDetailPage() {
  const params = useParams();
  const adId = params.id as string;
  const { data: ad, isLoading, error } = useAdminAd(adId);
  const { data: analytics } = useAdAnalytics(adId);
  const approveMutation = useApproveAd();
  const rejectMutation = useRejectAd();
  const pauseMutation = useAdminPauseAd();
  const resumeMutation = useAdminResumeAd();

  const handleApprove = async () => {
    try { await approveMutation.mutateAsync(adId); toast({ title: 'Approved' }); }
    catch { toast({ title: 'Failed to approve', variant: 'destructive' }); }
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try { await rejectMutation.mutateAsync({ id: adId, reason }); toast({ title: 'Rejected' }); }
    catch { toast({ title: 'Failed to reject', variant: 'destructive' }); }
  };

  const handlePause = async () => {
    try { await pauseMutation.mutateAsync(adId); toast({ title: 'Paused' }); }
    catch { toast({ title: 'Failed to pause', variant: 'destructive' }); }
  };

  const handleResume = async () => {
    try { await resumeMutation.mutateAsync(adId); toast({ title: 'Resumed' }); }
    catch { toast({ title: 'Failed to resume', variant: 'destructive' }); }
  };

  if (isLoading) return <div className="space-y-6"><DashboardPageHeader title="Loading..." /><TableSkeleton rows={5} /></div>;
  if (error || !ad) return (
    <div className="space-y-6">
      <DashboardPageHeader title="Advertisement" />
      <Card><CardContent className="py-12 text-center text-red-400">Advertisement not found</CardContent></Card>
    </div>
  );

  const summary = analytics?.summary;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={ad.title || AD_TYPE_LABELS[ad.type] || 'Advertisement'} actions={
        <Link href="/admin/advertising"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
      } />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Status</CardTitle></CardHeader>
          <CardContent><Badge className={STATUS_STYLES[ad.status]}>{ad.status.replace('_', ' ')}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Company</CardTitle></CardHeader>
          <CardContent className="font-medium">{ad.company?.name || 'N/A'}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Type</CardTitle></CardHeader>
          <CardContent className="font-medium">{AD_TYPE_LABELS[ad.type] || ad.type}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Pricing</CardTitle></CardHeader>
          <CardContent className="font-medium">{ad.pricingModel}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Budget</CardTitle></CardHeader>
          <CardContent className="font-medium">₹{Number(ad.spentBudget).toLocaleString()} / ₹{Number(ad.totalBudget).toLocaleString()}</CardContent></Card>
      </div>

      {ad.status === 'PENDING_REVIEW' && (
        <Card className="border-yellow-500/30">
          <CardHeader><CardTitle>Review Required</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
            <Button onClick={handleReject} variant="outline" className="text-red-400"><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
          </CardContent>
        </Card>
      )}

      {ad.status === 'ACTIVE' && (
        <div className="flex gap-2">
          <Button onClick={handlePause} variant="outline"><Pause className="mr-2 h-4 w-4" /> Pause</Button>
        </div>
      )}
      {ad.status === 'PAUSED' && (
        <div className="flex gap-2">
          <Button onClick={handleResume} variant="outline"><Play className="mr-2 h-4 w-4" /> Resume</Button>
        </div>
      )}

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
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ad.title && <div className="flex justify-between"><span className="text-gray-400">Title</span><span>{ad.title}</span></div>}
            {ad.description && <div className="flex justify-between"><span className="text-gray-400">Description</span><span className="text-right max-w-xs">{ad.description}</span></div>}
            {ad.targetUrl && <div className="flex justify-between"><span className="text-gray-400">Target URL</span><span className="text-right max-w-xs truncate">{ad.targetUrl}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">Start</span><span>{new Date(ad.startDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">End</span><span>{new Date(ad.endDate).toLocaleDateString()}</span></div>
            {ad.keyword && <div className="flex justify-between"><span className="text-gray-400">Keyword</span><span>{ad.keyword}</span></div>}
            {ad.city && <div className="flex justify-between"><span className="text-gray-400">City</span><span>{ad.city}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">Priority</span><span>{ad.priority}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Auto Pause/Resume/Stop</span><span>{[ad.autoPause && 'Pause', ad.autoResume && 'Resume', ad.autoStop && 'Stop'].filter(Boolean).join(', ') || 'None'}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Approval Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Created</span><span>{new Date(ad.createdAt).toLocaleString()}</span></div>
            {ad.approvedBy && <div className="flex justify-between"><span className="text-gray-400">Approved By</span><span>{ad.approvedBy}</span></div>}
            {ad.approvedAt && <div className="flex justify-between"><span className="text-gray-400">Approved At</span><span>{new Date(ad.approvedAt).toLocaleString()}</span></div>}
            {ad.rejectedReason && <div className="flex justify-between"><span className="text-gray-400">Rejection Reason</span><span className="text-red-400">{ad.rejectedReason}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">Total Impressions</span><span>{ad.impressions.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Total Clicks</span><span>{ad.clicks.toLocaleString()}</span></div>
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
