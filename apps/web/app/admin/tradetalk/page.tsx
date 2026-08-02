'use client';

import { Users, MessageCircle, TrendingUp, Mail, BarChart3, Building2, Tags } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useCommunityInsights } from '@/hooks/use-tradetalk';

export default function AdminTradeTalkPage() {
  const { data: insights, isLoading, error } = useCommunityInsights();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <ShimmerSkeleton className="h-8 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-6"><ShimmerSkeleton className="mb-2 h-8 w-16" /><ShimmerSkeleton className="h-4 w-24" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12">
          <EmptyState variant="error" title="Failed to load insights" description="Could not fetch TradeTalk analytics" />
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="TradeTalk Insights"
        description="Community growth, distribution, and engagement analytics"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-3"><MessageCircle className="h-6 w-6 text-accent" /></div>
              <div><p className="text-2xl font-bold text-text-primary">{insights.totalCommunities}</p><p className="text-xs text-text-tertiary">Total Communities</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-3"><Users className="h-6 w-6 text-green-400" /></div>
              <div><p className="text-2xl font-bold text-text-primary">{insights.totalMembers}</p><p className="text-xs text-text-tertiary">Total Members</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-3"><TrendingUp className="h-6 w-6 text-amber-400" /></div>
              <div><p className="text-2xl font-bold text-text-primary">{insights.communityGrowth30d}</p><p className="text-xs text-text-tertiary">New Communities (30d)</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-3"><Mail className="h-6 w-6 text-purple-400" /></div>
              <div><p className="text-2xl font-bold text-text-primary">{insights.pendingInvitations}</p><p className="text-xs text-text-tertiary">Pending Invitations</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-accent" />Industry Distribution</CardTitle></CardHeader>
          <CardContent>
            {!insights.industryDistribution?.length ? (
              <p className="py-8 text-center text-sm text-text-tertiary">No industry data available</p>
            ) : (
              <div className="space-y-3">
                {insights.industryDistribution.map((d) => (
                  <div key={d.industryId} className="flex items-center gap-3">
                    <span className="w-32 truncate text-sm text-text-primary">{d.industryName || d.industryId.slice(0, 8)}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-bg-elevated">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, (d.count / Math.max(...insights.industryDistribution.map((x) => x.count)) * 100))}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Tags className="h-5 w-5 text-accent" />Category Distribution</CardTitle></CardHeader>
          <CardContent>
            {!insights.categoryDistribution?.length ? (
              <p className="py-8 text-center text-sm text-text-tertiary">No category data available</p>
            ) : (
              <div className="space-y-3">
                {insights.categoryDistribution.map((d) => (
                  <div key={d.categoryId} className="flex items-center gap-3">
                    <span className="w-32 truncate text-sm text-text-primary">{d.categoryName || d.categoryId.slice(0, 8)}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-bg-elevated">
                        <div className="h-2 rounded-full bg-green-400" style={{ width: `${Math.min(100, (d.count / Math.max(...insights.categoryDistribution.map((x) => x.count)) * 100))}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Member Growth (30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-green-400">+{insights.memberGrowth30d}</p>
              <div className="text-sm text-text-tertiary">
                <p>New members joined</p>
                <p>{insights.totalMembers > 0 ? `${((insights.memberGrowth30d / insights.totalMembers) * 100).toFixed(1)}% of total` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Community Growth (30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-amber-400">+{insights.communityGrowth30d}</p>
              <div className="text-sm text-text-tertiary">
                <p>New communities created</p>
                <p>{insights.totalCommunities > 0 ? `${((insights.communityGrowth30d / insights.totalCommunities) * 100).toFixed(1)}% of total` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
