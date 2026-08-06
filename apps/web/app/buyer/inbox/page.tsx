'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCommConversations, useUnreadMessageCount } from '@/hooks';
import { DashboardPageHeader } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MessageSquare, Search, Archive, Pin, Mail, MailOpen, ArrowRight } from 'lucide-react';

const sourceLabels: Record<string, string> = {
  PRODUCT: 'Product Enquiry',
  COMPANY: 'Company Enquiry',
  REQUIREMENT_LIST: 'Requirement Discussion',
  SAVED_SUPPLIER: 'Supplier Enquiry',
  SAVED_PRODUCT: 'Product Enquiry',
  ORDER: 'Order Discussion',
  RFQ: 'RFQ Negotiation',
  SUPPORT: 'Support',
  GENERAL: 'General',
};

export default function BuyerInboxPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const { data: conversations, isLoading } = useCommConversations({ archived: filter === 'archived' ? true : undefined });
  const { data: unread } = useUnreadMessageCount();

  const filtered = (conversations ?? []).filter((c: any) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    sourceLabels[c.source]?.toLowerCase().includes(search.toLowerCase()) ||
    c.participants?.some((p: any) => p.user?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Inbox</h1>
            <p className="text-sm text-white/60">Your business conversations</p>
          </div>
          {unread?.total > 0 && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">{unread.total} unread</span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'unread', 'archived'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-accent text-white' : 'border border-border text-white/60 hover:border-border'}`}>
              {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unread?.total ?? 0})` : 'Archived'}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-surface pl-9 text-text-primary placeholder:text-text-primary/35" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12">
            <MessageSquare className="h-12 w-12 text-text-tertiary" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">No conversations yet</h3>
            <p className="mt-1 text-sm text-text-tertiary">Start a conversation from a product, company, or supplier page.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv: any) => {
              const lastMsg = conv.lastMessage;
              const otherParticipants = conv.participants?.filter((p: any) => p.userId !== 'me') ?? [];
              const isUnread = lastMsg && (!conv.participants?.[0]?.lastReadAt || new Date(lastMsg.createdAt) > new Date(conv.participants[0].lastReadAt));

              return (
                <Link key={conv.id} href={`/buyer/inbox/${conv.id}`}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition-all hover:border-[#f59e0b]/30 ${isUnread ? 'border-[#f59e0b]/20 bg-accent/5' : 'border-border bg-surface'}`}>
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isUnread ? 'bg-accent/20 text-accent-500' : 'bg-surface-secondary text-text-secondary'}`}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>
                        {conv.title || otherParticipants.map((p: any) => p.company?.name).filter(Boolean).join(', ') || 'Conversation'}
                      </p>
                      {lastMsg && <span className="flex-shrink-0 text-[10px] text-text-tertiary">{new Date(lastMsg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-text-tertiary">{sourceLabels[conv.source] || conv.source}</p>
                    {lastMsg && (
                      <p className="mt-1 truncate text-xs text-white/40">{lastMsg.content}</p>
                    )}
                  </div>
                  {isUnread && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
