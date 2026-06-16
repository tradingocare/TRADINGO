'use client';

import { useState } from 'react';
import { DashboardPageHeader, DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversations, useMessages, useSendMessage } from '@/hooks';
import { User, Send, MessageSquare } from 'lucide-react';
import type { Conversation, ChatMessage } from '@/lib/api/types';

export default function SellerChatPage() {
  const { data: conversations, isLoading, error } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedConvId ?? '');
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const [newMessage, setNewMessage] = useState('');

  const selectedConv = conversations?.find((c: Conversation) => c.id === selectedConvId);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvId) return;
    sendMessage({ conversationId: selectedConvId, content: newMessage.trim() });
    setNewMessage('');
  };

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Messages" description="Communicate with buyers" />
        <div className="rounded-xl border border-border bg-surface p-10 text-center dark:bg-dark-surface dark:border-dark-border">
          <p className="text-text-secondary dark:text-dark-text-secondary">Failed to load conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Messages" description="Communicate with buyers" />

      <div className="grid gap-0 overflow-hidden rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border lg:grid-cols-3">
        <div className="border-r border-border dark:border-dark-border lg:col-span-1">
          <div className="border-b border-border p-4 dark:border-dark-border">
            <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">Conversations</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {!conversations?.length ? (
              <div className="p-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv: Conversation) => {
                const otherParticipant = conv.participants?.find((p) => p.role !== 'SELLER') || conv.participants?.[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-secondary/50 dark:border-dark-border dark:hover:bg-dark-surface-secondary/50 ${selectedConvId === conv.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  >
                    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <User className="h-5 w-5" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary dark:text-dark-text-primary">{otherParticipant?.name || 'Unknown'}</p>
                      <p className="truncate text-xs text-text-secondary dark:text-dark-text-secondary">{conv.lastMessage?.content || 'No messages yet'}</p>
                      {conv.lastMessage?.createdAt && (
                        <p className="mt-0.5 text-[10px] text-text-tertiary">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col lg:col-span-2">
          {!selectedConvId ? (
            <div className="flex flex-1 items-center justify-center p-10">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-text-tertiary" />
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4 dark:border-dark-border">
                <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">
                  {selectedConv?.participants?.map((p) => p.name).join(', ') || 'Chat'}
                </h3>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[450px]">
                {messagesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex">
                      <div className="h-10 w-48 animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
                    </div>
                  ))
                ) : !messages?.length ? (
                  <p className="text-center text-sm text-text-secondary dark:text-dark-text-secondary">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg: ChatMessage) => (
                    <div key={msg.id} className="flex">
                      <div className="max-w-[75%] rounded-xl bg-surface-secondary px-4 py-2 text-sm dark:bg-dark-surface-secondary">
                        <p className="text-xs font-medium text-text-tertiary">{msg.senderName}</p>
                        <p className="mt-0.5 text-text-primary dark:text-dark-text-primary">{msg.content}</p>
                        <p className="mt-1 text-[10px] text-text-tertiary">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-border p-4 dark:border-dark-border">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button size="sm" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
