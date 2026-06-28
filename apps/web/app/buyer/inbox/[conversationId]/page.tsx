'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation, useConversationMessages, useCommSendMessage, useMarkConversationRead, useDeleteMessage, useReportMessage } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Trash2, Flag, Paperclip, Loader2, MoreVertical } from 'lucide-react';

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

  const { data: conv, isLoading: convLoading } = useConversation(conversationId);
  const { data: messagesData, isLoading: msgsLoading } = useConversationMessages(conversationId, { limit: 100 });
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1D0001' }}>
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  const messages = messagesData?.items ?? [];

  return (
    <div className="flex h-screen flex-col" style={{ background: '#1D0001' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,77,0,0.08), transparent)' }} />

      <div className="relative flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button onClick={() => router.back()} className="text-white/60 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{conv?.title || 'Conversation'}</p>
          {conv?.source && <p className="text-xs text-white/50">{sourceLabels[conv.source]}</p>}
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`group flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.senderId === 'me' ? 'bg-[#FF4D00] text-white' : 'bg-white/10 text-white/80'}`}>
              <p className="text-sm">{msg.content}</p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.senderId === 'me' && (
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
                  className="rounded-full bg-black/40 p-1 text-white/60 hover:text-yellow-400"><Flag className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative border-t border-white/10 p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-white/40"
          />
          <Button type="submit" disabled={!newMessage.trim() || sendMsg.isPending}
            className="bg-[#FF4D00] text-white hover:bg-[#FF4D00]/80">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
