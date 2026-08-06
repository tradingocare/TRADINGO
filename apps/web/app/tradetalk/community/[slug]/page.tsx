'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Users, Globe, Lock, Eye, LogIn, Settings, UserPlus,
  Building2, Calendar, Tag, ShieldCheck, Crown, Star, ListOrdered, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { AiCommunityCopilot } from '@/components/tradetalk/ai-community-copilot';
import { CreatePost } from '@/components/social/create-post';
import { FeedList } from '@/components/social/feed-list';
import { useCommunity, useJoinCommunity, useLeaveCommunity, useMyCommunities, useMembers } from '@/hooks/use-tradetalk';

const VISIBILITY_CONFIG = {
  PUBLIC: { icon: Globe, label: 'Public', color: 'text-green-400' },
  PRIVATE: { icon: Lock, label: 'Private', color: 'text-amber-400' },
  INVITE_ONLY: { icon: Eye, label: 'Invite Only', color: 'text-purple-400' },
} as const;

const JOIN_LABEL = {
  OPEN: 'Open to all',
  APPROVAL_REQUIRED: 'Requires approval',
  INVITE_ONLY: 'Invite only',
};

export default function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: community, isLoading, error } = useCommunity(slug);
  const { data: myCommunities } = useMyCommunities();
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  const myMembership = myCommunities?.find((m) => m.communityId === community?.id);
  const isMember = !!myMembership && myMembership.status === 'ACTIVE';
  const isOwner = myMembership?.role === 'OWNER';
  const isAdmin = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  const { data: leaderMembers } = useMembers(community?.id || '', { role: undefined, limit: 10 });

  const leaders = leaderMembers?.data?.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN') || [];

  const handleJoin = () => {
    if (!community) return;
    joinMutation.mutate(
      { communityId: community.id },
      {
        onSuccess: () => toast({ title: 'Joined community', description: `You are now a member of ${community.name}` }),
        onError: (err: Error) => toast({ title: 'Failed to join', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleLeave = () => {
    if (!community) return;
    leaveMutation.mutate(community.id, {
      onSuccess: () => toast({ title: 'Left community', description: `You have left ${community.name}` }),
      onError: (err: Error) => toast({ title: 'Failed to leave', description: err.message, variant: 'destructive' }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <ShimmerSkeleton className="h-8 w-64" />
        <ShimmerSkeleton className="h-48 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><ShimmerSkeleton className="h-64 w-full" /></div>
          <ShimmerSkeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12">
          <EmptyState variant="error" title="Community not found" description="This community does not exist or has been removed" />
        </CardContent></Card>
      </div>
    );
  }

  const visConfig = VISIBILITY_CONFIG[community.visibility] || VISIBILITY_CONFIG.PUBLIC;
  const VisIcon = visConfig.icon;

  const [activeTab, setActiveTab] = useState<'about' | 'feed' | 'rules' | 'activity'>('about');

  return (
    <div className="space-y-6 p-6">
      <div className="relative h-48 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5" />

      <div className="flex items-center gap-6 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('about')}
          className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'about' ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'feed' ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Feed
          {community.postCount > 0 && (
            <span className="ml-1 rounded-full bg-surface-secondary px-1.5 py-0.5 text-[10px]">{community.postCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'rules' ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <ListOrdered className="h-4 w-4" />Rules
        </button>
        {isMember && (
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'activity' ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Activity className="h-4 w-4" />Activity
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          {activeTab === 'about' && (
            <>
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-text-primary">{community.name}</h1>
                      {community.isFeatured && <Badge>Featured</Badge>}
                    </div>
                    {community.category && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-text-tertiary">
                        <Tag className="h-3 w-3" />{community.category.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isMember ? (
                      <Button onClick={handleJoin} disabled={joinMutation.isPending}>
                        <UserPlus className="mr-2 h-4 w-4" />Join
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={handleLeave} disabled={leaveMutation.isPending}>
                        <LogIn className="mr-2 h-4 w-4" />Leave
                      </Button>
                    )}
                    {isAdmin && (
                      <Link href={`/tradetalk/community/${community.slug}/manage`}>
                        <Button variant="outline"><Settings className="mr-2 h-4 w-4" />Manage</Button>
                      </Link>
                    )}
                  </div>
                </div>

                {community.description && (
                  <p className="text-text-secondary">{community.description}</p>
                )}
                {community.longDescription && (
                  <p className="mt-2 text-sm text-text-tertiary">{community.longDescription}</p>
                )}
              </div>

              {community.rooms && community.rooms.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Industry Rooms</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {community.rooms.map((room) => (
                        <div key={room.id} className="rounded-lg border border-border bg-bg-elevated p-4 transition-colors hover:border-accent/50">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-accent" />
                            <span className="font-medium text-text-primary">{room.name}</span>
                          </div>
                          {room.description && (
                            <p className="mt-1 text-xs text-text-tertiary">{room.description}</p>
                          )}
                          {room.memberCount > 0 && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
                              <Users className="h-3 w-3" />{room.memberCount} members
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {community.tags && community.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {community.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'rules' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListOrdered className="h-5 w-5 text-accent" />Community Rules</CardTitle>
              </CardHeader>
              <CardContent>
                {community.rules ? (
                  <div className="whitespace-pre-wrap rounded-lg border border-border bg-bg-elevated p-4 text-sm leading-relaxed text-text-secondary">
                    {community.rules}
                  </div>
                ) : (
                  <EmptyState variant="empty" icon={ListOrdered} title="No rules set" description="This community has not established any rules yet." />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-accent" />Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-text-tertiary">Activity feed coming soon — showing a timeline of recent posts, member joins, and community milestones.</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'feed' && isMember && (
            <div className="space-y-4">
              <CreatePost communityId={community.id} />
              <FeedList communityId={community.id} />
            </div>
          )}

          {activeTab === 'feed' && !isMember && (
            <Card><CardContent className="py-12">
              <EmptyState
                variant="empty"
                icon={MessageCircle}
                title="Join to see the feed"
                description="Become a member of this community to view and participate in discussions."
              />
            </CardContent></Card>
          )}
        </div>

        <div className="w-full space-y-4 lg:w-80">
          <Card>
            <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <VisIcon className={`h-5 w-5 ${visConfig.color}`} />
                <div><p className="font-medium text-text-primary">{visConfig.label}</p><p className="text-xs text-text-tertiary">Visibility</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-5 w-5 text-accent" />
                <div><p className="font-medium text-text-primary">{community.memberCount} members</p><p className="text-xs text-text-tertiary">{JOIN_LABEL[community.joinSetting]}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-text-secondary" />
                <div><p className="font-medium text-text-primary">{new Date(community.createdAt).toLocaleDateString()}</p><p className="text-xs text-text-tertiary">Created</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-5 w-5 text-text-secondary" />
                <div><p className="font-medium text-text-primary">{community.ownerId ? 'Individual' : 'Organization'}</p><p className="text-xs text-text-tertiary">Owner type</p></div>
              </div>
              {community.companyId && (
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                  <div><p className="font-medium text-text-primary">Company-backed</p><p className="text-xs text-text-tertiary">Linked to verified organization</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          {community.rules && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ListOrdered className="h-4 w-4 text-accent" />Rules</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary line-clamp-6">{community.rules}</p>
              </CardContent>
            </Card>
          )}

          {leaders.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Crown className="h-4 w-4 text-amber-400" />Community Leaders</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {leaders.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                      {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{member.user?.name || member.userId}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{member.role.toLowerCase()}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {isMember && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Star className="h-4 w-4 text-accent" />Membership</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="capitalize">{myMembership?.role?.toLowerCase()}</Badge>
                <p className="text-xs text-text-tertiary">
                  Joined {myMembership?.joinedAt ? new Date(myMembership.joinedAt).toLocaleDateString() : 'Recently'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {community && <AiCommunityCopilot communityId={community.id} communityName={community.name} />}
    </div>
  );
}
