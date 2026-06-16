'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FileUploadInput } from './file-upload-input';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onFileUpload?: (file: File) => void;
}

export function MessageInput({ onSend, onTyping, onFileUpload }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    onTyping?.();

    const lastAt = value.lastIndexOf('@');
    if (lastAt >= 0 && !value.slice(lastAt).includes(' ')) {
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
    }
  };

  const handleFileUpload = (file: File) => {
    onFileUpload?.(file);
    setShowUpload(false);
  };

  const handleEmojiPick = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {mentionOpen && (
        <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          {['Alice', 'Bob', 'Charlie'].map((user) => (
            <button
              key={user}
              onClick={() => {
                const before = text.slice(0, text.lastIndexOf('@'));
                setText(`${before}@${user} `);
                setMentionOpen(false);
                textareaRef.current?.focus();
              }}
              className="w-full rounded-md px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
            >
              @{user}
            </button>
          ))}
        </div>
      )}
      {showUpload && (
        <FileUploadInput onUpload={handleFileUpload} />
      )}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (@ to mention)"
            rows={1}
            className="min-h-[40px] w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 pr-20 text-sm ring-offset-surface placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
          />
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowUpload(!showUpload)}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleEmojiPick('😊')}
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
