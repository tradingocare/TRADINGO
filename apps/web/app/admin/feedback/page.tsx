'use client';

import { useEffect, useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { MessageSquare, Bug, Lightbulb, Star, Download } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  type: 'BUG' | 'FEATURE' | 'NPS' | 'GENERAL';
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  score?: number;
  comment?: string;
  businessImpact?: string;
  status?: string;
  createdAt: string;
}

export default function FeedbackDashboardPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<FeedbackEntry[]>('/beta-feedback')
      .then((r) => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type.toLowerCase() === filter);

  const stats = {
    total: entries.length,
    bugs: entries.filter((e) => e.type === 'BUG').length,
    features: entries.filter((e) => e.type === 'FEATURE').length,
    nps: entries.filter((e) => e.type === 'NPS').length,
  };

  const npsScores = entries.filter((e) => e.type === 'NPS' && e.score !== undefined).map((e) => e.score!);
  const avgNps = npsScores.length ? Math.round(npsScores.reduce((a, b) => a + b, 0) / npsScores.length) : 0;
  const promoters = npsScores.filter((s) => s >= 9).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = npsScores.length ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0;

  const exportCSV = () => {
    const header = 'id,type,title,category,priority,score,comment,createdAt\n';
    const rows = entries.map((e) =>
      `${e.id},${e.type},"${(e.title || e.comment || '').replace(/"/g, '""')}",${e.category || ''},${e.priority || ''},${e.score ?? ''},"${(e.comment || '').replace(/"/g, '""')}",${e.createdAt}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Beta Feedback"
        actions={
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-accent dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Submissions" value={String(stats.total)} icon={MessageSquare} />
        <StatCard label="Bug Reports" value={String(stats.bugs)} icon={Bug} changeType={stats.bugs > 0 ? 'positive' : 'neutral'} />
        <StatCard label="Feature Requests" value={String(stats.features)} icon={Lightbulb} />
        <StatCard label="NPS Responses" value={String(stats.nps)} icon={Star} />
        <StatCard
          label="NPS Score"
          value={npsScores.length ? String(npsScore) : '—'}
          icon={Star}
          changeType={npsScore > 0 ? 'positive' : 'neutral'}
        />
      </div>

      {avgNps > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${npsScore >= 50 ? 'text-green-500' : npsScore > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {npsScore}
                </div>
                <div className="text-xs text-text-secondary">NPS</div>
              </div>
              <div className="flex gap-4 text-sm">
                <div><span className="font-semibold text-green-500">{promoters}</span> Promoters</div>
                <div><span className="font-semibold text-yellow-500">{npsScores.length - promoters - detractors}</span> Passives</div>
                <div><span className="font-semibold text-red-500">{detractors}</span> Detractors</div>
                <div><span className="font-semibold">{avgNps}/10</span> Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Submissions</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="ml-auto rounded-md border border-border bg-surface px-3 py-1 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
            >
              <option value="all">All</option>
              <option value="bug">Bug Reports</option>
              <option value="feature">Feature Requests</option>
              <option value="nps">NPS</option>
            </select>
            <span className="text-sm text-text-secondary">{filtered.length} entries</span>
          </div>
          {loading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-text-secondary">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry) => (
                <details key={entry.id} className="rounded-lg border border-border p-3 dark:border-dark-border">
                  <summary className="flex cursor-pointer items-center gap-3 text-sm">
                    <StatusBadge status={entry.type} />
                    <span className="flex-1 font-medium text-text-primary dark:text-dark-text-primary">
                      {entry.title || (entry.type === 'NPS' ? `NPS Score: ${entry.score}/10` : '')}
                    </span>
                    {entry.priority && (
                      <StatusBadge status={entry.priority.toLowerCase()} />
                    )}
                    <span className="text-xs text-text-secondary">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </summary>
                  <div className="mt-2 space-y-1 pl-8 text-sm text-text-secondary">
                    {entry.description && <p>{entry.description}</p>}
                    {entry.comment && <p>Comment: {entry.comment}</p>}
                    {entry.category && <p>Category: {entry.category}</p>}
                    {entry.businessImpact && <p>Impact: {entry.businessImpact}</p>}
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
