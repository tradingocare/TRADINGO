'use client';

import { cn } from '@/lib/utils';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'] as const;

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, string[]>;
  onReact: (messageId: string, emoji: string) => void;
}

export function MessageReactions({ messageId, reactions, onReact }: MessageReactionsProps) {
  return (
    <div className="relative flex items-center gap-0.5">
      {EMOJIS.map((emoji) => {
        const users = reactions[emoji] ?? [];
        const count = users.length;
        return (
          <button
            key={emoji}
            onClick={() => onReact(messageId, emoji)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs transition-colors',
              users.length > 0
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary',
            )}
            title={users.length > 0 ? users.join(', ') : undefined}
          >
            <span className="text-sm leading-none">{emoji}</span>
            {count > 0 && <span className="text-[10px] font-medium leading-none">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
