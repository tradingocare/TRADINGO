'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCommConversations, useUnreadMessageCount } from '@/hooks';
import { DashboardPageHeader } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search, Archive, Pin, Mail, MailOpen, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)' }} />
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Inbox</h1>
            <p className="text-sm text-white/60">Your business conversations</p>
          </div>
          {unread?.total > 0 && (
            <span className="rounded-full bg-[#FF4D00] px-3 py-1 text-xs font-medium text-white">{unread.total} unread</span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'unread', 'archived'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-[#FF4D00] text-white' : 'border border-white/10 text-white/60 hover:border-white/20'}`}>
              {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unread?.total ?? 0})` : 'Archived'}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/40" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-white/40" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12">
            <MessageSquare className="h-12 w-12 text-white/30" />
            <h3 className="mt-4 text-lg font-semibold text-white">No conversations yet</h3>
            <p className="mt-1 text-sm text-white/50">Start a conversation from a product, company, or supplier page.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv: any) => {
              const lastMsg = conv.lastMessage;
              const otherParticipants = conv.participants?.filter((p: any) => p.userId !== 'me') ?? [];
              const isUnread = lastMsg && (!conv.participants?.[0]?.lastReadAt || new Date(lastMsg.createdAt) > new Date(conv.participants[0].lastReadAt));

              return (
                <Link key={conv.id} href={`/buyer/inbox/${conv.id}`}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition-all hover:border-[#FF4D00]/30 ${isUnread ? 'border-[#FF4D00]/20 bg-[#FF4D00]/5' : 'border-white/10 bg-white/5'}`}>
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isUnread ? 'bg-[#FF4D00]/20 text-[#FF4D00]' : 'bg-white/10 text-white/60'}`}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? 'font-semibold text-white' : 'text-white/80'}`}>
                        {conv.title || otherParticipants.map((p: any) => p.company?.name).filter(Boolean).join(', ') || 'Conversation'}
                      </p>
                      {lastMsg && <span className="flex-shrink-0 text-[10px] text-white/40">{new Date(lastMsg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-white/50">{sourceLabels[conv.source] || conv.source}</p>
                    {lastMsg && (
                      <p className="mt-1 truncate text-xs text-white/40">{lastMsg.content}</p>
                    )}
                  </div>
                  {isUnread && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#FF4D00]" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
