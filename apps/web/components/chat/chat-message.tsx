'use client';

import { cn } from '@/lib/utils';
import { MessageReactions } from './message-reactions';
import { FileText, Headphones, CheckCheck, Check } from 'lucide-react';

interface ChatMessageProps {
  message: {
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
  };
  isOwn: boolean;
  onReact: (messageId: string, emoji: string) => void;
}

export function ChatMessage({ message, isOwn, onReact }: ChatMessageProps) {
  const reactions = message.reactions ?? {};
  const readBy = message.readBy ?? [];
  const time = new Date(message.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-1">
            <img
              src={message.fileUrl}
              alt={message.content || 'Shared image'}
              className="max-w-[240px] rounded-lg object-cover"
            />
            {message.content && (
              <p className="text-sm text-text-primary dark:text-dark-text-primary">{message.content}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary/50 p-3 transition-colors hover:bg-surface-secondary dark:border-dark-border dark:bg-dark-surface-secondary/50 dark:hover:bg-dark-surface-secondary"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary dark:text-dark-text-primary">
                {message.fileName ?? 'File'}
              </p>
              {message.fileSize && (
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  {message.fileSize < 1024 * 1024
                    ? `${(message.fileSize / 1024).toFixed(1)} KB`
                    : `${(message.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                </p>
              )}
            </div>
          </a>
        );
      case 'voice':
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
              <Headphones className="h-4 w-4" />
            </div>
            <audio src={message.fileUrl} controls className="h-8 max-w-[200px]" />
          </div>
        );
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words text-text-primary dark:text-dark-text-primary">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={cn('flex gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isOwn
            ? 'bg-primary-600 text-white'
            : 'bg-surface-secondary text-text-primary dark:bg-dark-surface-secondary dark:text-dark-text-primary',
        )}
      >
        {message.senderAvatar ? (
          <img src={message.senderAvatar} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          message.senderName.charAt(0).toUpperCase()
        )}
      </div>
      <div className={cn('flex max-w-[75%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        <span className="mb-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
          {isOwn ? 'You' : message.senderName}
        </span>
        <div
          className={cn(
            'rounded-xl px-4 py-2',
            isOwn
              ? 'bg-primary-600 text-white rounded-tr-sm'
              : 'bg-surface-secondary dark:bg-dark-surface-secondary text-text-primary dark:text-dark-text-primary rounded-tl-sm',
          )}
        >
          {renderContent()}
        </div>
        <div className={cn('mt-0.5 flex items-center gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-text-tertiary">{time}</span>
          {isOwn && (
            readBy.length > 0 ? (
              <CheckCheck className="h-3 w-3 text-primary-600" />
            ) : (
              <Check className="h-3 w-3 text-text-tertiary" />
            )
          )}
        </div>
        {Object.keys(reactions).length > 0 && (
          <div className={cn('mt-0.5', isOwn ? 'self-end' : 'self-start')}>
            <MessageReactions messageId={message.id} reactions={reactions} onReact={onReact} />
          </div>
        )}
      </div>
    </div>
  );
}
