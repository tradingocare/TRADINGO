'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation, useConversationMessages, useCommSendMessage, useMarkConversationRead, useDeleteMessage, useReportMessage, useTemplates } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Trash2, Flag, Paperclip, Loader2 } from 'lucide-react';

export default function SellerConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const { data: conv, isLoading: convLoading } = useConversation(conversationId);
  const { data: messagesData, isLoading: msgsLoading } = useConversationMessages(conversationId, { limit: 100 });
  const { data: templates } = useTemplates();
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

  const insertTemplate = (content: string) => {
    setNewMessage(content);
  };

  if (convLoading || msgsLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div>;
  }

  const messages = messagesData?.items ?? [];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 dark:border-dark-border">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{conv?.title || 'Conversation'}</p>
          {conv?.source && <p className="text-xs text-text-secondary">{conv.source}</p>}
        </div>
        {templates?.length > 0 && (
          <div className="relative group">
            <Button variant="outline" size="sm" className="text-xs">Quick Replies</Button>
            <div className="absolute right-0 top-full z-50 mt-1 hidden w-64 rounded-lg border border-border bg-surface p-2 shadow-lg group-hover:block dark:bg-dark-surface dark:border-dark-border">
              {templates.map((tpl: any) => (
                <button key={tpl.id} onClick={() => insertTemplate(tpl.content)}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary">
                  <p className="font-medium">{tpl.title}</p>
                  <p className="mt-0.5 text-text-tertiary line-clamp-2">{tpl.content}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`group flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.senderId === 'me' ? 'bg-[#FF5A1F] text-white' : 'bg-surface-secondary text-text-primary dark:bg-dark-surface-secondary'}`}>
              <p className="text-sm">{msg.content}</p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.senderId === 'me' && <span className="text-[10px] opacity-60">{msg.status === 'READ' ? 'Read' : 'Delivered'}</span>}
              </div>
              {msg.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.attachments.map((att: any) => (
                    <a key={att.id} href={att.url} target="_blank" className="flex items-center gap-1 rounded-lg bg-black/20 px-2 py-1 text-[11px] hover:bg-black/30">
                      <Paperclip className="h-3 w-3" /> {att.originalName || 'Attachment'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 dark:border-dark-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." className="flex-1" />
          <Button type="submit" disabled={!newMessage.trim() || sendMsg.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
