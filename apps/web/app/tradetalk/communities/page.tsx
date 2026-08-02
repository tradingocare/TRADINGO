'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users, Globe, Lock, Eye, Plus, TrendingUp, Sparkles } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { useDiscoverCommunities, useCategories, useDiscoverFeatured, useDiscoverTrending, useDiscoverRecommended } from '@/hooks/use-tradetalk';
import type { Community } from '@/lib/api/tradetalk';

const VISIBILITY_CONFIG = {
  PUBLIC: { icon: Globe, label: 'Public', className: 'text-green-400 border-green-500/30' },
  PRIVATE: { icon: Lock, label: 'Private', className: 'text-amber-400 border-amber-500/30' },
  INVITE_ONLY: { icon: Eye, label: 'Invite Only', className: 'text-purple-400 border-purple-500/30' },
} as const;

function CommunityCard({ community }: { community: Community }) {
  const visConfig = VISIBILITY_CONFIG[community.visibility] || VISIBILITY_CONFIG.PUBLIC;
  const VisIcon = visConfig.icon;
  return (
    <Link href={`/tradetalk/community/${community.slug}`}>
      <Card className="h-full transition-colors hover:border-accent/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{community.name}</CardTitle>
            {community.isFeatured && <Badge variant="default">Featured</Badge>}
          </div>
          <CardDescription className="line-clamp-2">{community.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={visConfig.className}>
              <VisIcon className="mr-1 h-3 w-3" />{visConfig.label}
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-500/30">
              {community.joinSetting === 'OPEN' ? 'Open' : community.joinSetting === 'APPROVAL_REQUIRED' ? 'Approval' : 'Invite Only'}
            </Badge>
          </div>
          {community.category && (
            <p className="text-xs text-text-tertiary">{community.category.name}</p>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{community.memberCount}</span>
          <span className="flex items-center gap-1">Created {new Date(community.createdAt).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function DiscoverySection({ title, icon, communities, loading }: { title: string; icon: React.ReactNode; communities?: Community[]; loading: boolean }) {
  if (loading) {
    return (
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">{icon}{title}</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="w-72 shrink-0"><CardContent className="p-4"><ShimmerSkeleton className="mb-3 h-5 w-3/4" /><ShimmerSkeleton className="mb-2 h-4 w-full" /><ShimmerSkeleton className="h-4 w-1/3" /></CardContent></Card>
          ))}
        </div>
      </section>
    );
  }
  if (!communities?.length) return null;
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">{icon}{title}</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {communities.map((c) => (
          <div key={c.id} className="w-72 shrink-0"><CommunityCard community={c} /></div>
        ))}
      </div>
    </section>
  );
}

export default function CommunitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showDiscovery, setShowDiscovery] = useState(true);

  const { data: categories } = useCategories();
  const { data: communitiesData, isLoading } = useDiscoverCommunities({
    page, limit: 12,
    search: search || undefined,
    categoryId: categoryId || undefined,
  });
  const { data: featured, isLoading: featuredLoading } = useDiscoverFeatured(6);
  const { data: trending, isLoading: trendingLoading } = useDiscoverTrending(6);
  const { data: recommended, isLoading: recommendedLoading } = useDiscoverRecommended(6);

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="TradeTalk Communities"
        description="Discover and join business communities tailored to your industry"
        actions={
          <div className="flex gap-2">
            <Link href="/tradetalk/rankings">
              <Button variant="outline"><TrendingUp className="mr-2 h-4 w-4" />Rankings</Button>
            </Link>
            <Link href="/tradetalk/community/new">
              <Button><Plus className="mr-2 h-4 w-4" />Create</Button>
            </Link>
          </div>
        }
      />

      {showDiscovery && (
        <div className="space-y-6">
          <DiscoverySection title="Featured" icon={<Sparkles className="h-5 w-5 text-amber-400" />} communities={featured} loading={featuredLoading} />
          <DiscoverySection title="Trending" icon={<TrendingUp className="h-5 w-5 text-accent" />} communities={trending} loading={trendingLoading} />
          {recommended && recommended.length > 0 && (
            <DiscoverySection title="Recommended for You" icon={<Sparkles className="h-5 w-5 text-green-400" />} communities={recommended} loading={recommendedLoading} />
          )}
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <button onClick={() => setShowDiscovery(false)} className="text-accent hover:underline">Hide discovery</button>
          </div>
        </div>
      )}

      {!showDiscovery && (
        <button onClick={() => setShowDiscovery(true)} className="flex items-center gap-2 text-sm text-accent hover:underline">
          <Sparkles className="h-4 w-4" />Show discovery
        </button>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input placeholder="Search communities..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary">
              <option value="">All Categories</option>
              {categories?.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6">
              <ShimmerSkeleton className="mb-4 h-6 w-3/4" /><ShimmerSkeleton className="mb-2 h-4 w-full" /><ShimmerSkeleton className="mb-6 h-4 w-1/2" />
              <div className="flex gap-4"><ShimmerSkeleton className="h-4 w-16" /><ShimmerSkeleton className="h-4 w-16" /></div>
            </CardContent></Card>
          ))}
        </div>
      ) : !communitiesData?.data?.length ? (
        <Card><CardContent className="py-12">
          <EmptyState variant="empty" title="No communities found" description={search ? 'Try a different search term' : 'Be the first to create a community'}
            action={<Link href="/tradetalk/community/new"><Button><Plus className="mr-2 h-4 w-4" />Create Community</Button></Link>} />
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communitiesData.data.map((community: Community) => <CommunityCard key={community.id} community={community} />)}
          </div>
          {communitiesData.meta?.totalPages > 1 && (
            <div className="flex justify-center pt-4"><Pagination meta={communitiesData.meta} onPageChange={setPage} /></div>
          )}
        </>
      )}
    </div>
  );
}
