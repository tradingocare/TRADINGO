'use client';

import { DashboardPageHeader, StatCard, DashboardSkeleton, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTradgoRaces, useTradgoBadges, useLeaderboard } from '@/hooks';
import { Trophy, Medal, Zap, TrendingUp, Flame, Crown, Star, Users } from 'lucide-react';
import type { TradgoRace, TradgoBadge, LeaderboardEntry } from '@/lib/api/types';

const iconMap: Record<string, typeof Zap> = {
  Zap, TrendingUp, Flame, Crown, Star, Medal, Users, Trophy,
};

export default function SellerTradgoPage() {
  const { data: races, isLoading: racesLoading, error: racesError } = useTradgoRaces();
  const { data: badges, isLoading: badgesLoading } = useTradgoBadges();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard();

  const isLoading = racesLoading || badgesLoading || leaderboardLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="TRADGO Races" description="Compete in trading races and earn badges" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const raceStats = [
    { label: 'Active Races', value: String(races?.filter((r: TradgoRace) => r.status === 'active').length ?? 0), icon: Trophy },
    { label: 'Total Races', value: String(races?.length ?? 0), icon: Star },
    { label: 'Badges Earned', value: String(badges?.length ?? 0), icon: Medal },
    { label: 'Leaderboard Rank', value: '—', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="TRADGO Races"
        description="Compete in trading races and earn badges"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {raceStats.map((stat) => {
          const Icon = stat.icon;
          return <StatCard key={stat.label} icon={Icon} label={stat.label} value={stat.value} />;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Races</CardTitle>
            <CardDescription>Current and upcoming trading races</CardDescription>
          </CardHeader>
          <CardContent>
            {racesError ? (
              <p className="text-sm text-text-secondary">Failed to load races.</p>
            ) : !races?.length ? (
              <p className="text-sm text-text-secondary">No races available.</p>
            ) : (
              <div className="space-y-3">
                {races.map((race: TradgoRace) => (
                  <div key={race.id} className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-dark-border">
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{race.name}</p>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{race.participants} participants</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={race.status === 'active' ? 'default' : 'secondary'}>{race.status}</Badge>
                      <p className="mt-1 text-[10px] text-text-tertiary">{new Date(race.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Top traders this month</CardDescription>
          </CardHeader>
          <CardContent>
            {!leaderboard?.length ? (
              <p className="text-sm text-text-secondary">No leaderboard data yet.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry: LeaderboardEntry, index: number) => (
                  <div
                    key={entry.companyId || index}
                    className="flex items-center gap-4 rounded-lg border border-border p-3 dark:border-dark-border"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' :
                      index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{entry.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{entry.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {badges && badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Badges</CardTitle>
            <CardDescription>Achievements earned in TRADGO races</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {badges.map((badge: TradgoBadge) => {
                const IconComponent = iconMap[badge.icon] || Trophy;
                return (
                  <div key={badge.id} className="rounded-xl border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">{badge.name}</h3>
                    <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">{badge.description}</p>
                    {badge.earnedAt && (
                      <p className="mt-2 text-[10px] text-text-tertiary">Earned {new Date(badge.earnedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
