'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/use-toast';
import { useTicket, useAddMessage, useUpdateTicketStatus, useAssignTicket } from '@/hooks/use-support';
import { ArrowLeft, Send, Loader2, UserCheck } from 'lucide-react';
import type { SupportTicket, SupportTicketMessage } from '@/lib/api/support';

const PRIORITY_CONFIG: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' | 'success' }> = {
  LOW: { label: 'Low', variant: 'default' },
  MEDIUM: { label: 'Medium', variant: 'warning' },
  HIGH: { label: 'High', variant: 'destructive' },
  URGENT: { label: 'Urgent', variant: 'destructive' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'secondary' }> = {
  OPEN: { label: 'Open', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  WAITING: { label: 'Waiting', variant: 'secondary' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
};

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const { data: ticket, isLoading, isError, refetch } = useTicket(ticketId);
  const addMessage = useAddMessage();
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();

  const [reply, setReply] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    try {
      await addMessage.mutateAsync({ ticketId, message: reply.trim() });
      setReply('');
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ ticketId, status });
      await refetch();
      toast.success(`Ticket status updated to ${STATUS_CONFIG[status]?.label || status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async () => {
    if (!assigneeId.trim()) {
      toast({ title: 'Please enter a user ID', variant: 'destructive' });
      return;
    }
    try {
      await assignTicket.mutateAsync({ ticketId, assigneeId: assigneeId.trim() });
      await refetch();
      toast.success('Ticket assigned');
      setAssigneeId('');
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            variant="error"
            title="Failed to load ticket"
            description="Unable to fetch ticket details. It may have been removed or you may not have access."
            action={
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push('/admin/support')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Support
                </Button>
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const typedTicket = ticket as SupportTicket;
  const priorityConf = PRIORITY_CONFIG[typedTicket.priority] || PRIORITY_CONFIG.LOW;
  const statusConf = STATUS_CONFIG[typedTicket.status] || STATUS_CONFIG.OPEN;
  const messages: SupportTicketMessage[] = typedTicket.messages ?? [];

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.push('/admin/support')}
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{typedTicket.subject}</CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                  {typedTicket.company && <span>Company: {typedTicket.company.name}</span>}
                  {typedTicket.user && <span>User: {typedTicket.user.name} ({typedTicket.user.email})</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                  <Badge variant={priorityConf.variant}>{priorityConf.label}</Badge>
                  {typedTicket.category && (
                    <span className="text-xs text-text-tertiary uppercase tracking-wider">{typedTicket.category}</span>
                  )}
                  <span className="text-xs text-text-tertiary">
                    Created {new Date(typedTicket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {VALID_STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={typedTicket.status === s ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(s)}
                    disabled={updateStatus.isPending || typedTicket.status === s}
                  >
                    {STATUS_CONFIG[s]?.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-text-secondary font-medium mb-1">Description</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{typedTicket.description}</p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-text-secondary font-medium mb-3">Assignee</p>
              <div className="flex flex-wrap items-center gap-2">
                {typedTicket.assignee ? (
                  <Badge variant="default" className="gap-1">
                    <UserCheck className="h-3 w-3" />
                    {typedTicket.assignee.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-text-tertiary">Unassigned</span>
                )}
                <div className="flex gap-1 ml-2">
                  <Input
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    placeholder="Assign by user ID..."
                    className="h-8 w-40 text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={handleAssign} disabled={assignTicket.isPending}>
                    {assignTicket.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Assign'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Messages ({messages.length})
          </h3>

          {messages.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4">No messages yet. Send a reply below.</p>
          ) : (
            <div className="space-y-4">
              {[...messages].reverse().map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold uppercase">
                    {msg.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 rounded-xl bg-surface border border-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-text-primary">
                        {msg.user?.name || 'Unknown'}
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <label className="block text-sm font-medium text-text-primary mb-2">Reply</label>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply here..."
              rows={4}
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleSendReply} disabled={!reply.trim() || addMessage.isPending}>
                {addMessage.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
