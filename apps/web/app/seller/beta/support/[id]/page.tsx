'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  getSupportTicket,
  addTicketMessage,
  updateTicketStatus,
  type SupportTicket,
  type SupportTicketMessage,
} from '@/lib/api/beta';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';

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

const STATUS_TRANSITIONS: Record<string, string> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupportTicket(id);
      setTicket(data);
      setMessages(data.messages || []);
    } catch {
      setError('Ticket not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    setSending(true);
    try {
      const msg = await addTicketMessage(ticket.id, { message: newMessage });
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async () => {
    if (!ticket) return;
    const nextStatus = STATUS_TRANSITIONS[ticket.status];
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await updateTicketStatus(ticket.id, nextStatus);
      setTicket({ ...ticket, status: nextStatus as SupportTicket['status'] });
    } catch {
      // silently fail
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
        <span className="ml-3 text-text-secondary">Loading ticket...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-medium text-text-primary dark:text-dark-text-primary">
            {error || 'Ticket not found'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/seller/beta/support')}>
            Back to Support
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nextStatus = STATUS_TRANSITIONS[ticket.status];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/seller/beta/support')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Support
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
          {ticket.subject}
        </h1>
        <Badge variant={STATUS_BADGE_VARIANTS[ticket.status] || 'outline'}>
          {ticket.status.replace(/_/g, ' ')}
        </Badge>
        <Badge variant={PRIORITY_BADGE_VARIANTS[ticket.priority] || 'secondary'}>
          {ticket.priority}
        </Badge>
        {nextStatus && (
          <Button size="sm" variant="outline" onClick={handleStatusChange} disabled={updating}>
            {updating ? 'Updating...' : `Mark as ${nextStatus.replace(/_/g, ' ')}`}
          </Button>
        )}
      </div>

      {ticket.category && (
        <p className="text-sm text-text-tertiary">Category: {ticket.category}</p>
      )}

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary whitespace-pre-wrap">
            {ticket.description}
          </p>
          <p className="mt-3 text-xs text-text-tertiary">
            Created {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
          Messages ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-text-tertiary">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    {msg.userId}
                  </p>
                  <span className="text-xs text-text-tertiary">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary whitespace-pre-wrap">
                  {msg.message}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardContent className="p-5">
          <label className="mb-2 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
            Reply
          </label>
          <Textarea
            placeholder="Type your reply..."
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
