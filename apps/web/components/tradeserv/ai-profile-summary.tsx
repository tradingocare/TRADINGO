'use client';

import { useState } from 'react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';

interface AiProfileSummaryProps {
  name: string;
  title: string;
  bio: string;
  services: Array<{ name: string; description?: string | null }>;
  qualifications: Array<{ degree?: string; name?: string; institution?: string }>;
}

export function AiProfileSummary({ name, title, bio, services, qualifications }: AiProfileSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (summary) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-summary',
          context: {
            name,
            title,
            bio,
            services: services.map(s => s.name).join(', '),
            qualifications: qualifications.map(q => q.degree || q.name || '').filter(Boolean).join(', '),
            platform: 'tradeserv',
          },
        }),
      });
      const data = await response.json();
      setSummary(data?.result || data?.response || null);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={generateSummary}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : summary ? (
          <Sparkles className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
        {loading ? 'Generating...' : summary ? 'AI Summary Ready' : 'Generate AI Summary'}
      </button>
      {summary && (
        <div className="mt-3 rounded-xl border border-accent/20 bg-accent/[0.03] p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-accent mt-0.5" />
            <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
