'use client';

import { useState, useRef } from 'react';
import { Image, Link2, Send, Loader2, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useCreatePost } from '@/hooks/use-tradetalk';
import { useTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';
import { AiContentAssistant } from '@/components/tradetalk/ai-content-assistant';

interface CreatePostProps {
  communityId: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CreatePost({ communityId, onSuccess, placeholder }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { track } = useTracking();
  const createMutation = useCreatePost();

  const handleAiResult = (action: string, result: unknown) => {
    const data = (result as any)?.content;
    if (data && typeof data === 'string') {
      setContent(data);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    createMutation.mutate(
      {
        communityId,
        data: {
          content: content.trim(),
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          linkUrl: linkUrl.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          track(TrackingEvent.POST_CREATED, { properties: { communityId, hasMedia: mediaUrls.length > 0, hasLink: !!linkUrl } });
          setContent('');
          setMediaUrls([]);
          setLinkUrl('');
          setShowLinkInput(false);
          toast({ title: 'Post created' });
          onSuccess?.();
        },
        onError: (err: Error) => {
          toast({ title: 'Failed to create post', description: err.message, variant: 'destructive' });
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
    <Card className="border-border bg-surface">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            U
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'Share something with this community...'}
              rows={3}
              className="w-full resize-none border-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0"
              maxLength={10000}
            />

            {showLinkInput && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <Link2 className="h-4 w-4 text-text-tertiary" />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0"
                />
                <button onClick={() => { setLinkUrl(''); setShowLinkInput(false); }} className="text-text-tertiary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {mediaUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border px-4 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-text-tertiary hover:text-text-secondary" disabled>
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-text-tertiary hover:text-text-secondary ${showLinkInput ? 'text-accent' : ''}`}
            onClick={() => setShowLinkInput(!showLinkInput)}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-text-tertiary hover:text-text-secondary ${showAiAssistant ? 'text-accent' : ''}`}
            onClick={() => setShowAiAssistant(!showAiAssistant)}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-tertiary">Ctrl+Enter to post</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || createMutation.isPending}
            className="gap-1.5"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Post
          </Button>
        </div>
      </CardFooter>
    </Card>
    {showAiAssistant && (
      <AiContentAssistant content={content} communityId={communityId} onResult={handleAiResult} />
    )}
    </>
  );
}
