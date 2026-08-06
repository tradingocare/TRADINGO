'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MessageCircle, Users, ArrowRight, Mail, TrendingUp, Sparkles, ShieldCheck, Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyCommunities, useDashboardStats } from '@/hooks/use-tradetalk';
import { useAiDashboardWidgets } from '@/hooks/use-ai-tradetalk';

export function TradeTalkDashboardWidget() {
  const [showAi, setShowAi] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: myCommunities, isLoading: commsLoading } = useMyCommunities();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const aiDashboardMutation = useAiDashboardWidgets();

  const joinedCount = myCommunities?.filter((m) => m.status === 'ACTIVE').length || 0;
  const ownedCount = myCommunities?.filter((m) => m.role === 'OWNER').length || 0;
  const pendingCount = myCommunities?.filter((m) => m.status === 'PENDING').length || 0;
  const loading = commsLoading || statsLoading;

  return (
    <div className="rounded-3xl border border-border/5 bg-gradient-to-r from-accent/5 to-transparent p-6 backdrop-blur-xl transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">TradeTalk</h2>
        </div>
        <Link href="/tradetalk/communities" className="flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent">
          Browse <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-bg-elevated" />)}
          </div>
          <div className="h-20 animate-pulse rounded-lg bg-bg-elevated" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Link href="/tradetalk/my" className="rounded-lg border border-border/50 bg-bg-elevated p-3 transition-colors hover:border-accent/50">
              <p className="text-xs text-text-tertiary">Joined</p>
              <p className="text-lg font-bold text-text-primary">{joinedCount}</p>
              <p className="flex items-center gap-1 text-[10px] text-text-tertiary"><Users className="h-3 w-3" />communities</p>
            </Link>
            <Link href="/tradetalk/my" className="rounded-lg border border-border/50 bg-bg-elevated p-3 transition-colors hover:border-accent/50">
              <p className="text-xs text-text-tertiary">Owned</p>
              <p className="text-lg font-bold text-accent">{ownedCount}</p>
            </Link>
            {pendingCount > 0 ? (
              <Link href="/tradetalk/invitations" className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 transition-colors hover:border-amber-500/40">
                <p className="text-xs text-text-tertiary">Pending</p>
                <p className="text-lg font-bold text-amber-400">{pendingCount}</p>
                <p className="flex items-center gap-1 text-[10px] text-amber-400"><Mail className="h-3 w-3" />invitations</p>
              </Link>
            ) : (
              <Link href="/tradetalk/communities" className="rounded-lg border border-border/50 bg-bg-elevated p-3 transition-colors hover:border-accent/50">
                <p className="text-xs text-text-tertiary">Discover</p>
                <p className="text-lg font-bold text-accent">Find</p>
                <p className="text-[10px] text-text-tertiary">new communities</p>
              </Link>
            )}
          </div>

          {stats?.recommended && stats.recommended.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-text-secondary">
                <Sparkles className="h-3 w-3 text-green-400" />Recommended
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {stats.recommended.slice(0, 3).map((c) => (
                  <Link key={c.id} href={`/tradetalk/community/${c.slug}`}
                    className="shrink-0 rounded-lg border border-border/50 bg-bg-elevated p-2 text-xs transition-colors hover:border-accent/50"
                    style={{ minWidth: 140 }}>
                    <p className="truncate font-medium text-text-primary">{c.name}</p>
                    <p className="text-text-tertiary"><Users className="mr-0.5 inline h-3 w-3" />{c.memberCount}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {stats?.trendingIndustries && stats.trendingIndustries.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-text-secondary">
                <TrendingUp className="h-3 w-3 text-amber-400" />Trending Industries
              </p>
              <div className="flex flex-wrap gap-1">
                {stats.trendingIndustries.map((t) => (
                  <Badge key={t.industryId} variant="secondary" className="text-[10px]">
                    {t.industry?.name || t.industryId.slice(0, 8)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            {!showAi ? (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={async () => {
                setShowAi(true);
                setAiLoading(true);
                try {
                  const res = await aiDashboardMutation.mutateAsync({ limit: 3 });
                  const c = res?.data?.content;
                  setAiResult(typeof c === 'string' ? c : c?.text || c?.summary || JSON.stringify(c, null, 2));
                } catch {
                  setAiResult('Unable to load AI insights');
                } finally {
                  setAiLoading(false);
                }
              }}>
                <Bot className="mr-1 h-3 w-3" />AI Opportunities
              </Button>
            ) : aiLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated p-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-xs text-text-tertiary">Analyzing opportunities...</span>
              </div>
            ) : aiResult ? (
              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-medium text-text-secondary"><Bot className="h-3 w-3 text-accent" />AI Insights</span>
                  <button onClick={() => setShowAi(false)} className="text-[10px] text-text-tertiary hover:text-text-primary">Close</button>
                </div>
                <p className="whitespace-pre-wrap text-xs text-text-secondary leading-relaxed">{aiResult}</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
