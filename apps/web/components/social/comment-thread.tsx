'use client';

import { useState } from 'react';
import { useComments, useSendComment, useDeleteComment } from '@/hooks/use-tradetalk';
import { useTracking } from '@/hooks/use-tracking';
import { TrackingEvent } from '@/lib/tracking/events';
import { MessageSquare, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentThreadProps {
  postId: string;
  postOwnerId: string;
}

export function CommentThread({ postId, postOwnerId }: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [commentsPage, setCommentsPage] = useState(1);
  const limit = 50;

  const { data: commentsData, isLoading } = useComments(postId, {
    page: commentsPage,
    limit,
    ...(expanded ? {} : { enabled: false }),
  });

  const { track } = useTracking();
  const sendMutation = useSendComment();
  const deleteMutation = useDeleteComment();

  const handleSend = () => {
    if (!text.trim()) return;
    const isReply = !!replyTo?.id;
    const event = isReply ? TrackingEvent.POST_COMMENT_REPLIED : TrackingEvent.POST_COMMENTED;
    sendMutation.mutate(
      { postId, data: { content: text.trim(), replyToId: replyTo?.id } },
      {
        onSuccess: () => {
          track(event, { properties: { postId, isReply } });
          setText('');
          setReplyTo(null);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const comments = commentsData?.items ?? [];
  const hasMore = commentsData?.hasNext ?? false;

  return (
    <div className="border-t border-border pt-3 mt-3">
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors mb-2"
      >
        <MessageSquare className="w-4 h-4" />
        {commentsData?.total ?? '...'} comments
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <>
          {/* Comment list */}
          {isLoading ? (
            <div className="space-y-2 mb-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-surface rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary text-xs">
                        {comment.sender?.name ?? 'Deleted'}
                      </span>
                      {comment.sender?.id === postOwnerId && (
                        <span className="text-[10px] text-accent uppercase tracking-wider">OP</span>
                      )}
                      {comment.replyTo && (
                        <span className="text-[10px] text-text-tertiary">
                          replying to {comment.replyTo.senderId === postOwnerId ? 'OP' : 'a comment'}
                        </span>
                      )}
                    </div>
                    {comment.isOwn && (
                      <button
                        onClick={() => deleteMutation.mutate({ postId, messageId: comment.id })}
                        className="text-text-tertiary hover:text-status-error transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-text-secondary whitespace-pre-wrap">{comment.content}</p>
                  <button
                    onClick={() => setReplyTo({ id: comment.id, content: comment.content.slice(0, 80) })}
                    className="text-[11px] text-text-tertiary hover:text-accent mt-1 transition-colors"
                  >
                    Reply
                  </button>
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={() => setCommentsPage((p) => p + 1)}
                  className="text-sm text-accent hover:underline w-full text-center py-1"
                >
                  Load more comments
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary mb-3">No comments yet. Be the first!</p>
          )}

          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-text-tertiary bg-surface px-3 py-1.5 rounded-lg">
              <span>Replying to: &ldquo;{replyTo.content.slice(0, 50)}&rdquo;</span>
              <button onClick={() => setReplyTo(null)} className="text-status-error hover:underline ml-auto">
                Cancel
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              rows={1}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              className="bg-accent text-btn-primary-text rounded-lg p-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
