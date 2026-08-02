'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useTickets, useSupportStats, useUpdateTicketStatus, useAssignTicket } from '@/hooks/use-support';
import { MessageSquare, Search, CheckCircle2, XCircle, UserCheck, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { SupportTicket, TicketStats } from '@/lib/api/support';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Waiting', value: 'WAITING' },
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

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card className="hover:-translate-y-[2px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <Icon className={`h-4 w-4 ${color}`} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function TicketSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-8 w-20 ml-auto rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigneeInput, setAssigneeInput] = useState('');

  const { data, isLoading, isError, refetch } = useTickets({ status: statusFilter || undefined, category: categoryFilter || undefined, search: search || undefined, page, limit: 10 });
  const { data: stats, isLoading: statsLoading } = useSupportStats();
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();

  const tickets: SupportTicket[] = data?.data ?? data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrevious: false };
  const ticketStats: TicketStats | undefined = stats;

  const handleResolve = async (ticketId: string) => {
    try {
      await updateStatus.mutateAsync({ ticketId, status: 'RESOLVED' });
      await refetch();
      toast.success('Ticket resolved');
    } catch {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleClose = async (ticketId: string) => {
    try {
      await updateStatus.mutateAsync({ ticketId, status: 'CLOSED' });
      await refetch();
      toast.success('Ticket closed');
    } catch {
      toast.error('Failed to close ticket');
    }
  };

  const handleAssign = async (ticketId: string) => {
    if (!assigneeInput.trim()) {
      toast({ title: 'Please enter an assignee user ID', variant: 'destructive' });
      return;
    }
    try {
      await assignTicket.mutateAsync({ ticketId, assigneeId: assigneeInput.trim() });
      await refetch();
      toast.success('Ticket assigned');
      setAssigningId(null);
      setAssigneeInput('');
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  const statCards = [
    { label: 'Open', value: ticketStats?.open ?? 0, icon: AlertCircle, color: 'text-status-warning' },
    { label: 'In Progress', value: ticketStats?.inProgress ?? 0, icon: Clock, color: 'text-accent' },
    { label: 'Waiting', value: ticketStats?.waiting ?? 0, icon: MessageSquare, color: 'text-text-secondary' },
    { label: 'Resolved', value: ticketStats?.resolved ?? 0, icon: CheckCircle2, color: 'text-status-success' },
    { label: 'Closed', value: ticketStats?.closed ?? 0, icon: XCircle, color: 'text-text-tertiary' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Support Dashboard" description="Manage all support tickets across the platform" />

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader>
                  <CardContent className="pt-0"><Skeleton className="h-8 w-12" /></CardContent>
                </Card>
              ))
            : statCards.map((s) => <StatsCard key={s.label} {...s} />)
          }
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tickets by subject, company, or user..."
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            <option value="ORDER">Order</option>
            <option value="PAYMENT">Payment</option>
            <option value="ACCOUNT">Account</option>
            <option value="RFQ">RFQ</option>
            <option value="LISTING">Listing</option>
            <option value="KYC">KYC</option>
            <option value="TECHNICAL">Technical</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-surface p-1 border border-border overflow-x-auto">
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

        <div className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TicketSkeleton key={i} />)
          ) : isError ? (
            <EmptyState
              variant="error"
              title="Failed to load tickets"
              action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
            />
          ) : tickets.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No tickets found" description="All support tickets are resolved or filtered out" />
          ) : (
            tickets.map((ticket: SupportTicket) => {
              const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.LOW;
              const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

              return (
                <div key={ticket.id} className="rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/20">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    >
                      <h3 className="text-sm font-semibold text-text-primary truncate">{ticket.subject}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
                        {ticket.company && <span>{ticket.company.name}</span>}
                        {ticket.user && <span>{ticket.user.name}</span>}
                        <span>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                        <Badge variant={priorityConf.variant}>{priorityConf.label}</Badge>
                        {ticket.category && (
                          <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{ticket.category}</span>
                        )}
                        {ticket.assignee && (
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            <UserCheck className="h-3 w-3" />
                            {ticket.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <div className="flex gap-1">
                        {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleResolve(ticket.id); }} disabled={updateStatus.isPending}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {ticket.status !== 'CLOSED' && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleClose(ticket.id); }} disabled={updateStatus.isPending}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Close
                          </Button>
                        )}
                      </div>
                      {assigningId === ticket.id ? (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={assigneeInput}
                            onChange={(e) => setAssigneeInput(e.target.value)}
                            placeholder="User ID..."
                            className="h-8 w-32 text-xs"
                          />
                          <Button size="sm" variant="default" onClick={() => handleAssign(ticket.id)} disabled={assignTicket.isPending}>
                            {assignTicket.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Assign'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAssigningId(null); setAssigneeInput(''); }}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAssigningId(ticket.id); }}>
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {meta.totalPages > 1 && (
          <div className="mt-6">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
