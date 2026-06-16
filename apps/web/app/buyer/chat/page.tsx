'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard';
import { useConversations, useMessages, useSendMessage } from '@/hooks';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Conversation, ChatMessage } from '@/lib/api/types';

export default function BuyerChatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading, error: convsError } = useConversations();
  const { data: messages, isLoading: msgsLoading } = useMessages(selectedId ?? '');
  const { mutate: sendMsg, isPending: sending } = useSendMessage();

  const convList: Conversation[] = conversations ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!selectedId || !newMessage.trim()) return;
    sendMsg({ conversationId: selectedId, content: newMessage.trim() });
    setNewMessage('');
  };

  const selectedConv = convList.find((c) => c.id === selectedId);
  const otherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.role !== 'BUYER') ?? conv.participants[0];

  if (convsError) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Messages" description="Chat with sellers" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load conversations</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{convsError.message}</p>
        </div>
      </div>
    );
  }

  if (convsLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Messages" description="Chat with sellers" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Messages"
        description="Chat with sellers"
      />

      {convList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <MessageSquare className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No conversations yet</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Your messages with sellers will appear here once you start trading.</p>
        </div>
      ) : selectedConv && selectedId ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface lg:col-span-1 dark:bg-dark-surface dark:border-dark-border">
            <div className="border-b border-border px-4 py-3 dark:border-dark-border">
              <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Conversations</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {convList.map((conv) => {
                const participant = otherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-secondary/50 dark:border-dark-border dark:hover:bg-dark-surface-secondary/50 ${
                      conv.id === selectedId ? 'bg-surface-secondary dark:bg-dark-surface-secondary' : ''
                    }`}
                  >
                    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{participant.name}</p>
                      <p className="truncate text-xs text-text-secondary dark:text-dark-text-secondary">
                        {conv.lastMessage?.content ?? 'No messages yet'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-medium text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-border bg-surface lg:col-span-2 dark:bg-dark-surface dark:border-dark-border">
            <div className="border-b border-border px-6 py-3 dark:border-dark-border">
              <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{otherParticipant(selectedConv).name}</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6 max-h-[400px]">
              {msgsLoading ? (
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Loading messages...</p>
              ) : messages && messages.length > 0 ? (
                (messages as ChatMessage[]).map((msg) => (
                  <div key={msg.id} className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-text-primary dark:text-dark-text-primary">{msg.senderName}</span>
                      <span className="text-[10px] text-text-tertiary">{new Date(msg.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-text-secondary dark:text-dark-text-secondary">{msg.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No messages in this conversation yet.</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-3 border-t border-border px-6 py-4 dark:border-dark-border">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button size="sm" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          {convList.map((conv) => {
            const participant = otherParticipant(conv);
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className="flex w-full items-center gap-4 border-b border-border px-6 py-4 text-left transition-colors last:border-0 hover:bg-surface-secondary/50 dark:border-dark-border dark:hover:bg-dark-surface-secondary/50"
              >
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{participant.name}</p>
                    {conv.lastMessage && (
                      <span className="flex-shrink-0 text-xs text-text-tertiary">
                        {new Date(conv.lastMessage.createdAt).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-text-secondary dark:text-dark-text-secondary">
                    {conv.lastMessage?.content ?? 'No messages yet'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-medium text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
