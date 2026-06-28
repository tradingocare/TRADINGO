'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCommConversations, useUnreadMessageCount, useTemplates, useCreateTemplate } from '@/hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardPageHeader } from '@/components/dashboard';
import { MessageSquare, Search, Plus, Loader2, Save, ArrowRight } from 'lucide-react';

const sourceLabels: Record<string, string> = {
  PRODUCT: 'Product Enquiry', COMPANY: 'Company Enquiry', REQUIREMENT_LIST: 'Requirement Discussion',
  ORDER: 'Order Discussion', RFQ: 'RFQ Negotiation', SUPPORT: 'Support', GENERAL: 'General',
};

export default function SellerInboxPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const { data: conversations, isLoading } = useCommConversations({ archived: filter === 'archived' ? true : undefined });
  const { data: unread } = useUnreadMessageCount();
  const { data: templates } = useTemplates();
  const createTemplate = useCreateTemplate();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplForm, setTplForm] = useState({ title: '', content: '' });

  const filtered = (conversations ?? []).filter((c: any) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    sourceLabels[c.source]?.toLowerCase().includes(search.toLowerCase()) ||
    c.participants?.some((p: any) => p.user?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Inbox" description="Business conversations with buyers" />

      {unread?.total > 0 && (
        <div className="rounded-xl bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 px-4 py-3">
          <p className="text-sm font-medium text-[#FF5A1F]">{unread.total} unread conversations</p>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'unread', 'archived'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-[#FF5A1F] text-white' : 'border border-border text-text-secondary hover:border-[#FF5A1F]/30'}`}>
            {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unread?.total ?? 0})` : 'Archived'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
              <MessageSquare className="h-12 w-12 text-text-tertiary" />
              <h3 className="mt-4 text-lg font-semibold">No conversations</h3>
              <p className="mt-1 text-sm text-text-secondary">Buyers will reach out to you via your products and company profile.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((conv: any) => {
                const lastMsg = conv.lastMessage;
                const otherParticipant = conv.participants?.[0];
                const isUnread = lastMsg && (!conv.participants?.[0]?.lastReadAt || new Date(lastMsg.createdAt) > new Date(conv.participants[0].lastReadAt));

                return (
                  <Link key={conv.id} href={`/seller/inbox/${conv.id}`}
                    className={`flex items-start gap-4 rounded-xl border p-4 transition-colors hover:border-[#FF5A1F]/30 ${isUnread ? 'border-[#FF5A1F]/20 bg-[#FF5A1F]/5' : 'border-border bg-surface dark:bg-dark-surface dark:border-dark-border'}`}>
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isUnread ? 'bg-[#FF5A1F]/20 text-[#FF5A1F]' : 'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary'}`}>
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${isUnread ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>
                          {conv.title || otherParticipant?.company?.name || 'Conversation'}
                        </p>
                        {lastMsg && <span className="flex-shrink-0 text-[10px] text-text-tertiary">{new Date(lastMsg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-text-secondary">{sourceLabels[conv.source] || conv.source}</p>
                      {lastMsg && <p className="mt-1 truncate text-xs text-text-tertiary">{lastMsg.content}</p>}
                    </div>
                    {isUnread && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#FF5A1F]" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 dark:bg-dark-surface dark:border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Quick Replies</h3>
              <button onClick={() => setShowTemplateForm(!showTemplateForm)} className="text-[#FF5A1F] hover:text-[#FF4D00]">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showTemplateForm && (
              <form onSubmit={(e) => { e.preventDefault(); createTemplate.mutate(tplForm, { onSuccess: () => { setShowTemplateForm(false); setTplForm({ title: '', content: '' }); } }); }}
                className="mb-3 space-y-2">
                <Input placeholder="Template title" value={tplForm.title} onChange={(e) => setTplForm({ ...tplForm, title: e.target.value })} className="text-xs" />
                <textarea value={tplForm.content} onChange={(e) => setTplForm({ ...tplForm, content: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary dark:bg-dark-surface dark:border-dark-border" rows={3} placeholder="Template content..." />
                <Button size="sm" type="submit" disabled={!tplForm.title.trim() || !tplForm.content.trim()}>
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </form>
            )}

            <div className="space-y-2">
              {(!templates || templates.length === 0) ? (
                <p className="text-xs text-text-tertiary">No saved templates yet</p>
              ) : (
                templates.map((tpl: any) => (
                  <div key={tpl.id} className="cursor-pointer rounded-lg bg-surface-secondary/50 p-2.5 text-xs transition-colors hover:bg-surface-secondary dark:bg-dark-surface-secondary/50 dark:hover:bg-dark-surface-secondary">
                    <p className="font-medium text-text-primary">{tpl.title}</p>
                    <p className="mt-0.5 text-text-tertiary line-clamp-2">{tpl.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
