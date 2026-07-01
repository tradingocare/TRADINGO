'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCampaigns, useAdminCampaignDashboard, usePauseCampaign, useResumeCampaign, useArchiveCampaign, useCloneCampaign } from '@/hooks/use-campaign';
import { Plus, Play, Pause, Archive, Copy, ExternalLink, Megaphone, Trophy, FileText, DollarSign } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({ page, limit: 20 });
  const { data: dashboard, isLoading: dashboardLoading } = useAdminCampaignDashboard();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const archiveMutation = useArchiveCampaign();
  const cloneMutation = useCloneCampaign();

  const campaigns = campaignsData?.data ?? [];
  const totalPages = campaignsData?.totalPages ?? 0;
  const total = campaignsData?.total ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Campaign Engine"
        description="Manage promotions, cashback, and rewards"
        actions={<Link href="/admin/campaigns/new"><Button><Plus className="mr-2 h-4 w-4" /> New Campaign</Button></Link>}
      />

      {dashboardLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : dashboard ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Megaphone} label="Total Campaigns" value={String(dashboard.total)} />
          <StatCard icon={Play} label="Active" value={String(dashboard.active)} />
          <StatCard icon={FileText} label="Drafts" value={String(dashboard.draft)} />
          <StatCard icon={Trophy} label="Completed" value={String(dashboard.completed)} />
          <StatCard icon={DollarSign} label="Budget Used" value={`${(dashboard.budgetUsageRate * 100).toFixed(1)}%`} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <TableSkeleton />
          ) : !campaigns.length ? (
            <p className="text-sm text-text-secondary">No campaigns yet. Create your first campaign.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Budget</th>
                    <th className="pb-3 font-medium">Claims</th>
                    <th className="pb-3 font-medium">Period</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{c.name}</td>
                      <td className="py-3"><Badge variant="outline">{c.type}</Badge></td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>{c.status}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs">₹{Number(c.spentBudget).toLocaleString('en-IN')} / ₹{Number(c.budget).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3">{c.currentClaims}/{c.maxClaims || '∞'}</td>
                      <td className="py-3 text-xs text-text-secondary">
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Link href={`/admin/campaigns/${c.id}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                          </Link>
                          {c.status === 'ACTIVE' && (
                            <Button variant="ghost" size="sm" onClick={() => pauseMutation.mutate(c.id)}><Pause className="h-3 w-3" /></Button>
                          )}
                          {c.status === 'PAUSED' && (
                            <Button variant="ghost" size="sm" onClick={() => resumeMutation.mutate(c.id)}><Play className="h-3 w-3" /></Button>
                          )}
                          {c.status !== 'ARCHIVED' && (
                            <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate(c.id)}><Archive className="h-3 w-3" /></Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => cloneMutation.mutate(c.id)}><Copy className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Page {page} of {totalPages} ({total} total)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
