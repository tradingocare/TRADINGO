'use client';

import { useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './chat-message';
import { Loader2, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatListProps {
  messages: Array<{
    id: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'voice';
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    createdAt: string;
    readBy?: string[];
    reactions?: Record<string, string[]>;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }>;
  onLoadMore: () => void;
  hasMore: boolean;
  currentUserId: string;
  loading?: boolean;
}

export function ChatList({ messages, onLoadMore, hasMore, currentUserId, loading }: ChatListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      const isNewMessage = messages.length - prevLengthRef.current === 1;
      if (isNewMessage) {
        scrollToBottom(true);
      }
    } else if (messages.length > 0 && prevLengthRef.current === 0) {
      scrollToBottom(false);
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || loading) return;
    if (el.scrollTop < 80) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="relative">
      {hasMore && (
        <div className="sticky top-0 z-10 flex justify-center py-2">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading} className="text-xs">
            {loading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <ChevronUp className="mr-1 h-3 w-3" />
            )}
            Load older messages
          </Button>
        </div>
      )}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col gap-4 overflow-y-auto px-4 py-4"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {messages.length === 0 && !loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-text-tertiary">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} onReact={() => {}} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
