'use client';

import { MessageCircle, Check, X, Clock, Ban, User } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ShimmerSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useMyInvitations, useAcceptInvitation, useRejectInvitation } from '@/hooks/use-tradetalk';
import Link from 'next/link';

export default function InvitationsPage() {
  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();
  const { data: invitations, isLoading, error } = useMyInvitations();

  const handleAccept = (token: string) => {
    acceptMutation.mutate(
      { token },
      {
        onSuccess: () => toast({ title: 'Invitation accepted' }),
        onError: (err: Error) => toast({ title: 'Failed to accept', description: err.message, variant: 'destructive' }),
      },
    );
  };

  const handleReject = (token: string) => {
    rejectMutation.mutate(token, {
      onSuccess: () => toast({ title: 'Invitation declined' }),
      onError: (err: Error) => toast({ title: 'Failed to decline', description: err.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader title="Invitations" description="Manage your community invitations" />

      {isLoading ? (
        <Card><CardContent className="space-y-4 p-6">
          {Array.from({ length: 3 }).map((_, i) => (<ShimmerSkeleton key={i} className="h-16 w-full" />))}
        </CardContent></Card>
      ) : error ? (
        <Card><CardContent className="py-12">
          <EmptyState variant="error" title="Failed to load invitations" />
        </CardContent></Card>
      ) : !invitations?.length ? (
        <Card><CardContent className="py-12">
          <EmptyState
            variant="empty"
            title="No pending invitations"
            description="When someone invites you to a community, it will appear here"
            action={
              <Link href="/tradetalk/communities">
                <Button><MessageCircle className="mr-2 h-4 w-4" />Browse Communities</Button>
              </Link>
            }
          />
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Pending Invitations ({invitations.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{inv.community.name}</p>
                    <span className="text-xs text-text-tertiary">{inv.community.memberCount} members</span>
                  </div>
                  <p className="text-sm text-text-tertiary">{inv.community.description || 'No description'}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                    <User className="h-3 w-3" /> Invited by {inv.invitedBy.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(inv.token)} disabled={acceptMutation.isPending}>
                    <Check className="mr-1 h-4 w-4" />Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(inv.token)} disabled={rejectMutation.isPending}>
                    <X className="mr-1 h-4 w-4" />Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
