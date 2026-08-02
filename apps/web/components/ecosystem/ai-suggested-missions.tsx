'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, TrendingUp, Target, Users, MessageSquare, ShoppingCart, Star, Clock, DollarSign, Award } from 'lucide-react';
import Link from 'next/link';
import type { AiIntelligence } from '@/lib/api/ecosystem';

const ACTION_ICONS: Record<string, typeof Sparkles> = {
  LOGIN: Zap,
  RFQ_CREATED: Target,
  QUOTE_SUBMITTED: MessageSquare,
  AI_USAGE: Sparkles,
  DAILY_CHECKIN: Clock,
};

interface AiSuggestedMissionsProps {
  intelligence: AiIntelligence | undefined;
  loading?: boolean;
  role?: 'buyer' | 'seller';
}

export function AiSuggestedMissions({ intelligence, loading, role = 'buyer' }: AiSuggestedMissionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-400" />
            AI Suggested Missions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  if (!intelligence || intelligence.recommendations.length === 0) {
    return null;
  }

  const recommendations = intelligence.recommendations.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-400" />
          AI Suggested Missions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, i) => {
          const actionMatch = rec.match(/([A-Z_]+)/);
          const Icon = actionMatch ? (ACTION_ICONS[actionMatch[0]] ?? Sparkles) : Sparkles;
          const xpHint = i === 0 ? '+15 XP' : i === 1 ? '+10 XP' : '+5 XP';
          return (
            <div key={i} className="group flex items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3 transition hover:border-accent/20 hover:bg-accent/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/20 bg-accent/10">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">{rec}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="border-accent-500/20 text-[10px] text-accent-500">{xpHint}</Badge>
                  <Badge variant="outline" className="border-status-success/20 text-[10px] text-status-success">+2 GOCASH</Badge>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
