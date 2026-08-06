'use client';

import Link from 'next/link';
import { MessageCircle, Users, Globe, Plus, Settings } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { useMyCommunities } from '@/hooks/use-tradetalk';
import type { MyCommunity } from '@/lib/api/tradetalk';

const ROLE_BADGE = {
  OWNER: { label: 'Owner', variant: 'default' as const },
  ADMIN: { label: 'Admin', variant: 'default' as const },
  MODERATOR: { label: 'Moderator', variant: 'secondary' as const },
  MEMBER: { label: 'Member', variant: 'outline' as const },
};

export default function MyCommunitiesPage() {
  const { data: myCommunities, isLoading } = useMyCommunities();

  const owned = myCommunities?.filter((m) => m.role === 'OWNER') || [];
  const joined = myCommunities?.filter((m) => m.role !== 'OWNER' && m.status === 'ACTIVE') || [];

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="My Communities"
        description="Manage your TradeTalk communities"
        actions={
          <Link href="/tradetalk/community/new">
            <Button><Plus className="mr-2 h-4 w-4" />Create Community</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <ShimmerSkeleton className="mb-4 h-6 w-3/4" />
                <ShimmerSkeleton className="mb-2 h-4 w-full" />
                <ShimmerSkeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !myCommunities?.length ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              variant="empty"
              title="No communities yet"
              description="Join a community or create your own to get started"
              action={
                <Link href="/tradetalk/communities">
                  <Button><MessageCircle className="mr-2 h-4 w-4" />Browse Communities</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {owned.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-text-primary">Owned Communities ({owned.length})</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {owned.map((m) => (
                  <CommunityCard key={m.id} membership={m} />
                ))}
              </div>
            </section>
          )}
          {joined.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-text-primary">Joined Communities ({joined.length})</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {joined.map((m) => (
                  <CommunityCard key={m.id} membership={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CommunityCard({ membership }: { membership: MyCommunity }) {
  const c = membership.community;
  const roleBadge = ROLE_BADGE[membership.role as keyof typeof ROLE_BADGE] || ROLE_BADGE.MEMBER;

  return (
    <Link href={`/tradetalk/community/${c.slug}`}>
      <Card className="h-full transition-colors hover:border-accent/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{c.name}</CardTitle>
            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
          </div>
          <CardDescription className="line-clamp-1">{c.description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary">
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{c.memberCount} members</span>
        </CardContent>
        <CardFooter className="text-xs text-text-tertiary">
          Joined {new Date(membership.joinedAt).toLocaleDateString()}
          {membership.role === 'OWNER' && (
            <Link href={`/tradetalk/community/${c.slug}/manage`} onClick={(e) => e.stopPropagation()} className="ml-auto">
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
