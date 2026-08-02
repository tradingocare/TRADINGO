'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, Award, Clock, Zap, Medal, Building2, ShieldCheck } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { useRankings } from '@/hooks/use-tradetalk';
import type { Community, RankingCommunity } from '@/lib/api/tradetalk';

const RANKING_TABS = [
  { value: 'most-active', label: 'Most Active', icon: <Activity className="h-4 w-4" /> },
  { value: 'highest-trust', label: 'Highest Trust', icon: <ShieldCheck className="h-4 w-4" /> },
  { value: 'fastest-growing', label: 'Fastest Growing', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'largest-membership', label: 'Largest', icon: <Users className="h-4 w-4" /> },
  { value: 'newest', label: 'Newest', icon: <Clock className="h-4 w-4" /> },
];

function Activity(props: { className?: string }) { return <Zap className={props.className} />; }

function RankingCard({ community, rank }: { community: Community | RankingCommunity; rank: number }) {
  const trustScore = 'company' in community ? (community as RankingCommunity).company?.trustScore : undefined;
  const isTop3 = rank <= 3;
  return (
    <div className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-accent/50 ${isTop3 ? 'border-accent/20 bg-accent/5' : 'border-border bg-bg-elevated'}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${rank === 1 ? 'bg-amber-500/20 text-amber-400' : rank === 2 ? 'bg-gray-400/20 text-gray-300' : rank === 3 ? 'bg-orange-600/20 text-orange-400' : 'bg-surface text-text-tertiary'}`}>
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/tradetalk/community/${community.slug}`} className="font-semibold text-text-primary hover:text-accent">
          {community.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
          {community.category && <span>{community.category.name}</span>}
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{community.memberCount}</span>
          {trustScore != null && <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-400" />{trustScore}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {community.isFeatured && <Badge variant="default" className="text-[10px]">Featured</Badge>}
        <Badge variant="outline" className="text-[10px] capitalize">{community.visibility.toLowerCase()}</Badge>
      </div>
    </div>
  );
}

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState('most-active');
  const { data: rankings, isLoading } = useRankings(activeTab, 20);

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Community Rankings"
        description="Discover top communities across multiple dimensions"
      />

      <Tabs tabs={RANKING_TABS} value={activeTab} onChange={setActiveTab} variant="pills" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><ShimmerSkeleton className="h-6 w-3/4" /></CardContent></Card>
          ))}
        </div>
      ) : !rankings?.length ? (
        <Card><CardContent className="py-12">
          <EmptyState variant="empty" title="No rankings available" description="Communities will appear here as they grow" />
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rankings.map((community: Community | RankingCommunity, i: number) => (
            <RankingCard key={community.id} community={community} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
