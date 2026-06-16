'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface NpsSurveyProps {
  onSubmit: (score: number, comment?: string) => void;
}

export function NpsSurvey({ onSubmit }: NpsSurveyProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getScoreColor = (s: number) => {
    if (s <= 6) return 'bg-red-500 hover:bg-red-600';
    if (s <= 8) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-green-500 hover:bg-green-600';
  };

  const getScoreLabel = () => {
    if (score === null) return '';
    if (score <= 6) return 'Detractor';
    if (score <= 8) return 'Passive';
    return 'Promoter';
  };

  const getScoreLabelColor = () => {
    if (score === null) return '';
    if (score <= 6) return 'text-red-500';
    if (score <= 8) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleSubmit = async () => {
    if (score === null) return;
    setSubmitting(true);
    await onSubmit(score, comment);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
        How likely are you to recommend TRADINGO to other businesses?
      </p>
      <div className="flex justify-between gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScore(s)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white transition-all ${
              score === s ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
            } ${getScoreColor(s)}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-secondary">
        <span>0 - Not likely</span>
        <span>10 - Extremely likely</span>
      </div>
      {score !== null && (
        <p className={`text-center text-sm font-semibold ${getScoreLabelColor()}`}>
          {score} — {getScoreLabel()}
        </p>
      )}
      <div>
        <Label>Optional comment</Label>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What's the main reason for your score?" rows={2} />
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={score === null || submitting}>
        <Star className="mr-2 h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit NPS Score'}
      </Button>
    </div>
  );
}
