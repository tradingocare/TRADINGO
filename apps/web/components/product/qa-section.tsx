'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { askQuestion, answerQuestion } from '@/lib/api/products';
import { type ProductDetailQa } from '@/types/product-detail';

interface QaSectionProps {
  questions: ProductDetailQa[];
  productSlug?: string;
}

const PAGE_SIZE = 5;

export function QaSection({ questions, productSlug }: QaSectionProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerForm, setAnswerForm] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [asking, setAsking] = useState(false);
  const [answering, setAnswering] = useState<string | null>(null);

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const paged = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !productSlug) return;
    if (!user) { router.push('/login'); return; }
    setAsking(true);
    try {
      await askQuestion(productSlug, newQuestion.trim());
      toast({ title: 'Question submitted', description: 'Seller will respond shortly.' });
      setNewQuestion('');
    } catch {
      toast({ title: 'Failed to submit question', variant: 'destructive' });
    } finally {
      setAsking(false);
    }
  };

  const handleAnswerSubmit = async (qId: string) => {
    if (!answerText.trim() || !productSlug) return;
    if (!user) { router.push('/login'); return; }
    setAnswering(qId);
    try {
      await answerQuestion(productSlug, qId, answerText.trim());
      toast({ title: 'Answer submitted' });
      setAnswerForm(null);
      setAnswerText('');
    } catch {
      toast({ title: 'Failed to submit answer', variant: 'destructive' });
    } finally {
      setAnswering(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAskSubmit} className="flex gap-2">
        <Input
          placeholder="Ask a question about this product..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <Button type="submit" disabled={!newQuestion.trim() || asking}>
          <Send className="mr-2 h-4 w-4" />
          {asking ? 'Asking...' : 'Ask'}
        </Button>
      </form>

      {paged.length === 0 && (
        <p className="py-8 text-center text-text-secondary dark:text-dark-text-secondary">
          No questions yet. Be the first to ask!
        </p>
      )}

      <div className="space-y-4">
        {paged.map((qa) => (
          <div
            key={qa.id}
            className="rounded-xl border border-border bg-surface p-5 dark:bg-dark-surface dark:border-dark-border"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-700 dark:text-primary-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  {qa.question}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary dark:text-dark-text-tertiary">
                  {qa.askedBy && <span>Asked by {qa.askedBy}</span>}
                  <span>
                    {new Date(qa.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {qa.answer && (
                  <div className="mt-3 rounded-lg bg-accent-500/5 p-3 dark:bg-accent-500/10">
                    <p className="text-sm font-medium text-accent-700 dark:text-accent-300">
                      Seller Answer
                    </p>
                    <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                      {qa.answer}
                    </p>
                    {qa.answeredAt && (
                      <p className="mt-1 text-xs text-text-tertiary dark:text-dark-text-tertiary">
                        Answered{' '}
                        {new Date(qa.answeredAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                )}

                {!qa.answer && answerForm !== qa.id && user?.role === 'SELLER' && (
                  <button
                    onClick={() => setAnswerForm(qa.id)}
                    className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Answer this question
                  </button>
                )}

                {answerForm === qa.id && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Write your answer..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAnswerSubmit(qa.id)}
                      disabled={!answerText.trim() || answering === qa.id}
                    >
                      {answering === qa.id ? 'Sending...' : 'Submit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAnswerForm(null);
                        setAnswerText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
              className="min-w-[2rem]"
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
