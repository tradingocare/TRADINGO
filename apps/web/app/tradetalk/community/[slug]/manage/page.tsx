'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, MessageCircle, Shield, Settings, Trash2,
  ChevronRight, Mail, Plus, X, Crown, Ban,
} from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/use-toast';
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table';
import {
  useCommunity, useMembers, useUpdateMemberRole, useRemoveMember,
  useInviteMember, useCommunityInvitations, useCancelInvitation,
  useRooms, useCreateRoom, useDeleteRoom,
  useMyCommunities,
} from '@/hooks/use-tradetalk';

export default function ManageCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const { data: community, isLoading: commLoading } = useCommunity(slug);
  const { data: myCommunities } = useMyCommunities();
  const { data: membersData, isLoading: membersLoading } = useMembers(community?.id || '', { limit: 50 });
  const { data: invitations, isLoading: invLoading } = useCommunityInvitations(community?.id || '');
  const { data: rooms, isLoading: roomsLoading } = useRooms(community?.id || '');

  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();
  const inviteMutation = useInviteMember();
  const cancelInvMutation = useCancelInvitation();
  const createRoomMutation = useCreateRoom();
  const deleteRoomMutation = useDeleteRoom();

  const [activeTab, setActiveTab] = useState('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [roomName, setRoomName] = useState('');
  const [roomSlug, setRoomSlug] = useState('');
  const [roomDesc, setRoomDesc] = useState('');

  const myMembership = myCommunities?.find((m) => m.communityId === community?.id);
  const isOwner = myMembership?.role === 'OWNER';
  const isAdmin = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  if (commLoading) {
    return (
      <div className="space-y-6 p-6">
        <ShimmerSkeleton className="h-8 w-64" />
        <ShimmerSkeleton className="h-12 w-96" />
        <ShimmerSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12">
          <EmptyState variant="error" title="Community not found" />
        </CardContent></Card>
      </div>
    );
  }

  if (!isAdmin) {
    router.push(`/tradetalk/community/${slug}`);
    return null;
  }

  const handleUpdateRole = (userId: string, role: string) => {
    updateRoleMutation.mutate(
      { communityId: community.id, userId, role },
      {
        onSuccess: () => toast({ title: 'Role updated' }),
        onError: (err: Error) => toast({ title: 'Failed to update role', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate(
      { communityId: community.id, userId },
      {
        onSuccess: () => toast({ title: 'Member removed' }),
        onError: (err: Error) => toast({ title: 'Failed to remove member', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate(
      { communityId: community.id, data: { email: inviteEmail, role: inviteRole } },
      {
        onSuccess: () => {
          toast({ title: 'Invitation sent', description: `Invitation sent to ${inviteEmail}` });
          setShowInviteModal(false);
          setInviteEmail('');
        },
        onError: (err: Error) => toast({ title: 'Failed to invite', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleCancelInvitation = (invitationId: string) => {
    cancelInvMutation.mutate(
      { invitationId: invitationId, communityId: community.id },
      {
        onSuccess: () => toast({ title: 'Invitation cancelled' }),
        onError: (err: Error) => toast({ title: 'Failed to cancel', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleCreateRoom = () => {
    if (!roomName || !roomSlug) return;
    createRoomMutation.mutate(
      { communityId: community.id, data: { name: roomName, slug: roomSlug, description: roomDesc || undefined } },
      {
        onSuccess: () => {
          toast({ title: 'Room created' });
          setShowRoomModal(false);
          setRoomName('');
          setRoomSlug('');
          setRoomDesc('');
        },
        onError: (err: Error) => toast({ title: 'Failed to create room', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleDeleteRoom = (roomId: string) => {
    deleteRoomMutation.mutate(
      { communityId: community.id, roomId },
      {
        onSuccess: () => toast({ title: 'Room deleted' }),
        onError: (err: Error) => toast({ title: 'Failed to delete room', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const members = membersData?.data || [];
  const pendingInvitations = invitations?.filter((i) => i.status === 'PENDING') || [];

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title={`Manage ${community.name}`}
        description="Manage members, invitations, and industry rooms"
      />

      <Tabs
        tabs={[
          { value: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
          { value: 'invitations', label: `Invitations${pendingInvitations.length ? ` (${pendingInvitations.length})` : ''}`, icon: <Mail className="h-4 w-4" /> },
          { value: 'rooms', label: 'Industry Rooms', icon: <MessageCircle className="h-4 w-4" /> },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Members ({members.length})</CardTitle>
              <Button size="sm" onClick={() => setShowInviteModal(true)}><UserPlus className="mr-2 h-4 w-4" />Invite</Button>
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <ShimmerSkeleton className="h-48 w-full" />
            ) : !members.length ? (
              <EmptyState variant="empty" title="No members yet" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR><TH>Name</TH><TH>Role</TH><TH>Joined</TH><TH className="text-right">Actions</TH></TR>
                  </THead>
                  <TBody>
                    {members.map((member) => (
                      <TR key={member.id}>
                        <TD className="font-medium">{member.user?.name || member.userId}</TD>
                        <TD>
                          {isOwner && member.role !== 'OWNER' ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                              className="rounded border border-border bg-surface px-2 py-1 text-xs"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          ) : (
                            <Badge variant="outline" className="capitalize">{member.role.toLowerCase()}</Badge>
                          )}
                        </TD>
                        <TD className="text-text-secondary">{new Date(member.joinedAt).toLocaleDateString()}</TD>
                        <TD className="text-right">
                          {member.role !== 'OWNER' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={removeMemberMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'invitations' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Invitations</CardTitle>
              <Button size="sm" onClick={() => setShowInviteModal(true)}><UserPlus className="mr-2 h-4 w-4" />Invite</Button>
            </div>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <ShimmerSkeleton className="h-32 w-full" />
            ) : !invitations?.length ? (
              <EmptyState variant="empty" title="No invitations sent" action={
                <Button size="sm" onClick={() => setShowInviteModal(true)}>Send Invitation</Button>
              } />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR><TH>Email</TH><TH>Role</TH><TH>Status</TH><TH>Sent</TH><TH className="text-right">Actions</TH></TR>
                  </THead>
                  <TBody>
                    {invitations.map((inv) => (
                      <TR key={inv.id}>
                        <TD>{inv.email}</TD>
                        <TD className="capitalize">{inv.role.toLowerCase()}</TD>
                        <TD>
                          <Badge variant="outline" className={
                            inv.status === 'PENDING' ? 'text-amber-400 border-amber-500/30' :
                            inv.status === 'ACCEPTED' ? 'text-green-400 border-green-500/30' :
                            inv.status === 'REJECTED' ? 'text-red-400 border-red-500/30' :
                            'text-text-tertiary'
                          }>{inv.status}</Badge>
                        </TD>
                        <TD className="text-text-secondary">{new Date(inv.createdAt).toLocaleDateString()}</TD>
                        <TD className="text-right">
                          {inv.status === 'PENDING' && (
                            <Button size="sm" variant="ghost" onClick={() => handleCancelInvitation(inv.id)}>
                              <Ban className="h-4 w-4 text-red-400" />
                            </Button>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'rooms' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Industry Rooms ({rooms?.length || 0})</CardTitle>
              <Button size="sm" onClick={() => setShowRoomModal(true)}><Plus className="mr-2 h-4 w-4" />Create Room</Button>
            </div>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <ShimmerSkeleton className="h-32 w-full" />
            ) : !rooms?.length ? (
              <EmptyState variant="empty" title="No rooms yet" action={
                <Button size="sm" onClick={() => setShowRoomModal(true)}>Create Room</Button>
              } />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-accent" />
                        <span className="font-medium text-text-primary">{room.name}</span>
                      </div>
                      {room.description && <p className="mt-1 text-xs text-text-tertiary">{room.description}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRoom(room.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Member" size="sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email address</label>
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary"
            >
              <option value="MEMBER">Member</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <Button onClick={handleInvite} className="w-full" disabled={!inviteEmail || inviteMutation.isPending}>
            {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </Modal>

      <Modal open={showRoomModal} onClose={() => setShowRoomModal(false)} title="Create Industry Room" size="sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Room name</label>
            <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g. Taxation Discussion" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <Input value={roomSlug} onChange={(e) => setRoomSlug(e.target.value)} placeholder="taxation-discussion" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <Input value={roomDesc} onChange={(e) => setRoomDesc(e.target.value)} placeholder="Room description" />
          </div>
          <Button onClick={handleCreateRoom} className="w-full" disabled={!roomName || !roomSlug || createRoomMutation.isPending}>
            {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
