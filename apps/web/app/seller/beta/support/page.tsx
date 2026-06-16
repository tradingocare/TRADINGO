'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getSupportTickets, createSupportTicket, type SupportTicket } from '@/lib/api/beta';
import { Plus, MessageSquare, ChevronRight, Loader2, X } from 'lucide-react';

const STATUS_BADGE_VARIANTS: Record<string, 'outline' | 'warning' | 'success' | 'secondary'> = {
  OPEN: 'outline',
  IN_PROGRESS: 'warning',
  WAITING: 'outline',
  RESOLVED: 'success',
  CLOSED: 'secondary',
};

const PRIORITY_BADGE_VARIANTS: Record<string, 'secondary' | 'default' | 'warning' | 'destructive'> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'destructive',
};

const CATEGORIES = ['Technical', 'Billing', 'Account', 'Product', 'Other'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'Technical', priority: 'Medium' });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSupportTickets();
      setTickets(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await createSupportTicket(form);
      setShowModal(false);
      setForm({ subject: '', description: '', category: 'Technical', priority: 'Medium' });
      await fetchTickets();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Support Center"
        description="Manage your support tickets"
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <span className="ml-3 text-text-secondary">Loading tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="mb-4 h-12 w-12 text-text-tertiary" />
            <p className="text-lg font-medium text-text-primary dark:text-dark-text-primary">
              No tickets yet. Create your first support ticket.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/seller/beta/support/${ticket.id}`)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                      {ticket.subject}
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANTS[ticket.status] || 'outline'}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant={PRIORITY_BADGE_VARIANTS[ticket.priority] || 'secondary'}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary line-clamp-1">
                    {ticket.description}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
                    {ticket.category && <span>{ticket.category}</span>}
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>New Support Ticket</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  Subject
                </label>
                <Input
                  placeholder="Brief title of your issue"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your issue in detail"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    Category
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    Priority
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p.toUpperCase()}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={submitting || !form.subject.trim() || !form.description.trim()}>
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
