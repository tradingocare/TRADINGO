'use client';

import { useParams } from 'next/navigation';
import { useCampaign, useUpdateCampaign, useCampaignAnalytics } from '@/hooks/use-campaign';
import { DashboardPageHeader, StatCard, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Target, Activity } from 'lucide-react';

export default function AdminCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useCampaign(id);
  const { data: analytics } = useCampaignAnalytics(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Campaign Details" description="Loading..." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Campaign Details" description="Campaign not found" />
        <p className="text-text-secondary">The requested campaign could not be found.</p>
      </div>
    );
  }

  const totalAnalytics = analytics?.reduce((acc, a) => ({
    claims: acc.claims + a.claims,
    approved: acc.approved + a.approved,
    paid: acc.paid + a.paid,
    rewardAmount: acc.rewardAmount + Number(a.rewardAmount),
  }), { claims: 0, approved: 0, paid: 0, rewardAmount: 0 });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={campaign.name}
        description={campaign.description ?? `${campaign.type} Campaign`}
        actions={<Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>{campaign.status}</Badge>}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Budget" value={`₹${Number(campaign.budget).toLocaleString('en-IN')}`} change={`Spent: ₹${Number(campaign.spentBudget).toLocaleString('en-IN')}`} />
        <StatCard icon={Users} label="Claims" value={String(campaign.currentClaims)} change={campaign.maxClaims ? `Max: ${campaign.maxClaims}` : 'Unlimited'} />
        <StatCard icon={Calendar} label="Duration" value={`${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}`} />
        <StatCard icon={Target} label="Type" value={campaign.type} change={`Priority: ${campaign.priority}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
          <CardContent>
            {!campaign.rules?.length ? (
              <p className="text-sm text-text-secondary">No rules configured.</p>
            ) : (
              <div className="space-y-3">
                {campaign.rules.map((rule) => (
                  <div key={rule.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">IF {rule.conditionField} {rule.conditionOperator} {JSON.stringify(rule.conditionValue)}</span>
                      <Badge variant="outline">{rule.actionType}</Badge>
                    </div>
                    <p className="mt-1 text-text-secondary">THEN {JSON.stringify(rule.actionValue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Targeting</CardTitle></CardHeader>
          <CardContent>
            {!campaign.targets?.length ? (
              <p className="text-sm text-text-secondary">No targeting rules. Open to all.</p>
            ) : (
              <div className="space-y-2">
                {campaign.targets.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <Badge variant={t.isInclude ? 'default' : 'destructive'}>{t.isInclude ? 'INCLUDE' : 'EXCLUDE'}</Badge>
                    <span>{t.targetType}: {t.targetId}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle><Activity className="mr-2 inline h-4 w-4" />Analytics</CardTitle></CardHeader>
        <CardContent>
          {!analytics?.length ? (
            <p className="text-sm text-text-secondary">No analytics data yet.</p>
          ) : (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-3"><p className="text-2xl font-bold">{totalAnalytics?.claims ?? 0}</p><p className="text-xs text-text-secondary">Total Claims</p></div>
                <div className="rounded-lg border p-3"><p className="text-2xl font-bold">{totalAnalytics?.approved ?? 0}</p><p className="text-xs text-text-secondary">Approved</p></div>
                <div className="rounded-lg border p-3"><p className="text-2xl font-bold">{totalAnalytics?.paid ?? 0}</p><p className="text-xs text-text-secondary">Paid</p></div>
                <div className="rounded-lg border p-3"><p className="text-2xl font-bold">₹{Number(totalAnalytics?.rewardAmount ?? 0).toLocaleString('en-IN')}</p><p className="text-xs text-text-secondary">Total Rewards</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left"><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Claims</th><th className="pb-2 font-medium">Approved</th><th className="pb-2 font-medium">Paid</th><th className="pb-2 font-medium">Amount</th></tr>
                  </thead>
                  <tbody>
                    {analytics.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-2">{new Date(a.date).toLocaleDateString()}</td>
                        <td className="py-2">{a.claims}</td>
                        <td className="py-2">{a.approved}</td>
                        <td className="py-2">{a.paid}</td>
                        <td className="py-2">₹{Number(a.rewardAmount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
