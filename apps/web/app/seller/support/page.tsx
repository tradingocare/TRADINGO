'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useTickets, useCreateTicket } from '@/hooks/use-support';
import { TicketPlus, MessageSquare } from 'lucide-react';
import type { SupportTicket } from '@/lib/api/support';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
] as const;

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

function TicketSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.LOW;
  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-surface p-5 text-left transition-all duration-200 hover:border-accent/20 hover:bg-bg-elevated"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary truncate">{ticket.subject}</h3>
          <p className="mt-1 text-xs text-text-tertiary line-clamp-2">{ticket.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
            <Badge variant={priorityConf.variant}>{priorityConf.label}</Badge>
            {ticket.category && (
              <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{ticket.category}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-text-tertiary">
            {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
          {ticket._count && (
            <p className="mt-1 flex items-center justify-end gap-1 text-xs text-text-tertiary">
              <MessageSquare className="h-3 w-3" />
              {ticket._count.messages}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SellerSupportPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const { data, isLoading, isError, refetch } = useTickets({ status: statusFilter || undefined, page, limit: 10 });
  const createMutation = useCreateTicket();

  const tickets: SupportTicket[] = data?.data ?? data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrevious: false };

  const handleCreate = async () => {
    if (!subject.trim() || !description.trim()) {
      toast({ title: 'Please fill in subject and description', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({ subject: subject.trim(), description: description.trim(), category: category || undefined, priority });
      toast.success('Ticket created successfully');
      setCreateOpen(false);
      setSubject('');
      setDescription('');
      setCategory('');
      setPriority('MEDIUM');
    } catch {
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start justify-between gap-4">
          <PageHeader title="Support" description="Track and manage your support requests" />
          <Button onClick={() => setCreateOpen(true)} className="mt-24 shrink-0">
            <TicketPlus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </div>

        <div className="mt-6 flex gap-1 rounded-xl bg-surface p-1 border border-border overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-accent text-btn-primary-text'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <TicketSkeleton key={i} />)
          ) : isError ? (
            <EmptyState
              variant="error"
              title="Failed to load tickets"
              description="Unable to fetch your support tickets. Please try again."
              action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
            />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No tickets found"
              description={statusFilter ? `No ${STATUS_TABS.find(t => t.value === statusFilter)?.label} tickets` : 'Create a support ticket to get help'}
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <TicketPlus className="mr-2 h-4 w-4" />
                  Create Ticket
                </Button>
              }
            />
          ) : (
            tickets.map((ticket: SupportTicket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => {}} />
            ))
          )}
        </div>

        {meta.totalPages > 1 && (
          <div className="mt-6">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Support Ticket" size="lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Subject *</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Description *</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail" rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  <option value="ORDER">Order Issues</option>
                  <option value="LISTING">Product Listings</option>
                  <option value="ACCOUNT">Account & Billing</option>
                  <option value="KYC">KYC & Verification</option>
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Priority</label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
