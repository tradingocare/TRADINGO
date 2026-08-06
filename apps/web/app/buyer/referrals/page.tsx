'use client';

import { useState, useMemo } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ReferralShare } from '@/components/referral/referral-share';
import {
  Gift, Users, Award, TrendingUp, Copy, Plus, ExternalLink, AlertCircle,
  DollarSign, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import {
  useMyReferralCode, useMyReferralCodes, useReferralStatistics,
  useReferralHistory, useCreateReferralCode,
} from '@/hooks/use-referral';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/use-toast';
import { usePageTracking, useTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tradingo.com';

export default function BuyerReferralPage() {
  const { track } = useTracking();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const user = useAuthStore((s: any) => s.user);

  const { data: activeCode, isLoading: codeLoading, error: codeError } = useMyReferralCode();
  const { data: allCodes, isLoading: codesLoading } = useMyReferralCodes();
  const { data: stats, isLoading: statsLoading, error: statsError } = useReferralStatistics();
  const { data: history, isLoading: historyLoading, error: historyError } = useReferralHistory();
  const createCode = useCreateReferralCode();
  usePageTracking(TrackingEvent.REFERRAL_PAGE_VIEW, { hasCode: !!activeCode });

  const handleCreateCode = async () => {
    if (!user?.sub) return;
    try {
      await createCode.mutateAsync({
        userId: user.sub,
        type: 'GENERAL',
        maxUsage: 100,
      });
      track(TrackingEvent.REFERRAL_APPLY, { properties: { referralCode: activeCode?.code || 'new', source: 'create_form' } });
      toast({ title: 'Referral code created', description: 'Share it with other businesses to earn rewards.' });
      setShowCreateForm(false);
    } catch (err: any) {
      toast({ title: 'Failed to create code', description: err?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const recentActivity = useMemo(() => {
    if (!history) return [];
    const items = [...(history.usages || []), ...(history.rewards || [])];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  }, [history]);

  const isLoading = codeLoading || statsLoading || historyLoading;
  const hasError = codeError || statsError || historyError;
  const hasCode = !!activeCode;

  if (isLoading) {
    return (
      <div>
        <DashboardPageHeader title="Referral Program" description="Refer businesses and earn rewards" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TableSkeleton rows={5} />
          </div>
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-surface-secondary" />
            <div className="h-48 animate-pulse rounded-xl bg-surface-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div>
        <DashboardPageHeader title="Referral Program" />
        <EmptyState
          variant="error"
          icon={AlertCircle}
          title="Failed to load referral data"
          description="Please try again later"
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      <DashboardPageHeader
        title="Referral Program"
        description="Refer businesses to TRADINGO and earn GOCASH rewards"
        actions={
          !hasCode && !showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Referral Code
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Gift} label="Total Earned" value={`₹${(stats?.totalRewardsEarned ?? 0).toLocaleString('en-IN')}`} />
        <StatCard icon={Users} label="Total Referrals" value={String(stats?.totalReferrals ?? 0)} />
        <StatCard icon={Award} label="Successful" value={String(stats?.rewardedCount ?? 0)} change={stats?.totalReferrals ? `${Math.round((stats.rewardedCount / stats.totalReferrals) * 100)}%` : '0%'} changeType="positive" />
        <StatCard icon={TrendingUp} label="Active Codes" value={String(stats?.activeCodes ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Create Code Prompt */}
          {!hasCode && showCreateForm && (
            <Card>
              <CardContent className="flex flex-col items-center py-8 text-center">
                <Gift className="mb-3 h-10 w-10 text-accent" />
                <h3 className="text-lg font-semibold text-text-primary">Generate Your Referral Code</h3>
                <p className="mt-1 max-w-sm text-sm text-text-secondary">
                  Create a unique referral code to share with other businesses. You will earn GOCASH rewards for every successful referral.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleCreateCode} disabled={createCode.isPending} className="gap-2">
                    {createCode.isPending ? 'Creating...' : 'Generate Code'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Code State */}
          {!hasCode && !showCreateForm && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <EmptyState
                  icon={Gift}
                  title="No referral code yet"
                  description="Create your referral code to start earning rewards for every business you refer."
                  action={<Button onClick={() => setShowCreateForm(true)} className="gap-2"><Plus className="h-4 w-4" />Create Referral Code</Button>}
                />
              </CardContent>
            </Card>
          )}

          {/* Activity Table */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TH>Type</TH>
                      <TH>Detail</TH>
                      <TH>Status</TH>
                      <TH>Date</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {recentActivity.map((item: any) => {
                      const isReward = 'amount' in item;
                      const status = item.status || (isReward ? 'PAID' : 'COMPLETED');
                      return (
                        <TR key={item.id}>
                          <TD>
                            <div className="flex items-center gap-2">
                              {isReward ? <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> : <Users className="h-3.5 w-3.5 text-accent" />}
                              <span className="text-xs font-medium">{isReward ? 'Reward' : 'Referral'}</span>
                            </div>
                          </TD>
                          <TD>
                            <span className="text-xs text-text-secondary">
                              {isReward ? `₹${item.amount} earned` : item.refereeEmail || item.refereeUserId || 'New user'}
                            </span>
                          </TD>
                          <TD>
                            <Badge variant={
                              status === 'PAID' || status === 'REWARDED' || status === 'COMPLETED' ? 'success' :
                              status === 'FAILED' || status === 'REJECTED' ? 'destructive' : 'default'
                            }>
                              {status}
                            </Badge>
                          </TD>
                          <TD><span className="text-xs text-text-tertiary">{new Date(item.createdAt).toLocaleDateString()}</span></TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Empty history */}
          {hasCode && recentActivity.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <EmptyState
                  icon={Users}
                  title="No activity yet"
                  description="Share your referral code with other businesses. You will see activity here when someone signs up using your code."
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Share Card */}
          {hasCode && activeCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share & Earn</CardTitle>
              </CardHeader>
              <CardContent>
                <ReferralShare code={activeCode.code} baseUrl={BASE_URL} />
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Codes</span>
                  <span className="font-medium text-text-primary">{stats.totalCodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Active Codes</span>
                  <span className="font-medium text-text-primary">{stats.activeCodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Success Rate</span>
                  <span className="font-medium text-emerald-500">
                    {stats.totalReferrals > 0 ? `${Math.round((stats.rewardedCount / stats.totalReferrals) * 100)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Failed</span>
                  <span className="font-medium text-status-error">{stats.failedCount}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
