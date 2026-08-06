'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation, useConversationMessages, useCommSendMessage, useMarkConversationRead, useDeleteMessage, useReportMessage } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Send, Trash2, Flag, Paperclip, MoreVertical } from 'lucide-react';

const sourceLabels: Record<string, string> = {
  PRODUCT: 'Product Enquiry', COMPANY: 'Company Enquiry', REQUIREMENT_LIST: 'Requirement Discussion',
  ORDER: 'Order Discussion', RFQ: 'RFQ Negotiation', SUPPORT: 'Support', GENERAL: 'General',
};

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);

  const currentUser = useAuthStore((s: any) => s.user);
  const currentUserId = currentUser?.id || '';
  const { data: conv, isLoading: convLoading, isError: convError } = useConversation(conversationId);
  const { data: messagesData, isLoading: msgsLoading, isError: msgsError } = useConversationMessages(conversationId, { limit: 100 });
  const sendMsg = useCommSendMessage();
  const markRead = useMarkConversationRead();
  const deleteMsg = useDeleteMessage();
  const reportMsg = useReportMessage();

  useEffect(() => { if (conversationId) markRead.mutate(conversationId); }, [conversationId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messagesData]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMsg.mutate({ conversationId, content: newMessage }, { onSuccess: () => setNewMessage('') });
  };

  if (convLoading || msgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (convError || msgsError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="text-white/60 mb-4">Failed to load conversation</p>
          <button onClick={() => router.back()} className="text-accent-500 hover:text-accent-500 text-sm">Go back</button>
        </div>
      </div>
    );
  }

  const messages = messagesData?.items ?? [];

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />

      <div className="relative flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => router.back()} className="text-white/60 hover:text-white" aria-label="Back to inbox"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{conv?.title || 'Conversation'}</p>
          {conv?.source && <p className="text-xs text-white/50">{sourceLabels[conv.source]}</p>}
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`group flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.senderId === currentUserId ? 'bg-accent text-text-primary' : 'bg-surface-secondary text-text-primary'}`}>
              <p className="text-sm">{msg.content}</p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.senderId === currentUserId && (
                  <span className="text-[10px] opacity-60">{msg.status === 'READ' ? 'Read' : msg.status === 'DELIVERED' ? 'Delivered' : 'Sent'}</span>
                )}
              </div>
              {msg.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.attachments.map((att: any) => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-black/20 px-2 py-1 text-[11px] hover:bg-black/30">
                      <Paperclip className="h-3 w-3" /> {att.originalName || 'Attachment'}
                    </a>
                  ))}
                </div>
              )}
              <div className={`absolute top-1 ${msg.senderId === 'me' ? 'left-1' : 'right-1'} hidden group-hover:flex gap-1`}>
                {msg.senderId === 'me' && (
                  <button onClick={() => deleteMsg.mutate({ conversationId, messageId: msg.id })}
                    className="rounded-full bg-black/40 p-1 text-white/60 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                )}
                <button onClick={() => reportMsg.mutate({ conversationId, messageId: msg.id, reason: 'Inappropriate' })}
                  className="rounded-full bg-black/40 p-1 text-white/60 hover:text-accent-500"><Flag className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative border-t border-border p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border-border bg-surface text-text-primary placeholder:text-text-primary/35"
          />
          <Button type="submit" disabled={!newMessage.trim() || sendMsg.isPending}
            className="bg-accent text-white hover:bg-accent/80">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
