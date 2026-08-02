'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { XPProgressCard } from '@/components/ecosystem/xp-progress-card';
import { BadgeCard } from '@/components/ecosystem/badge-card';
import { AchievementCard } from '@/components/ecosystem/achievement-card';
import { MissionCard } from '@/components/ecosystem/mission-card';
import { MissionCategoryTabs } from '@/components/ecosystem/mission-category-tabs';
import { DailyCheckinCard } from '@/components/ecosystem/daily-checkin-card';
import { RewardTimeline } from '@/components/ecosystem/reward-timeline';
import { RewardStatistics } from '@/components/ecosystem/reward-statistics';
import { RewardSummary } from '@/components/ecosystem/reward-summary';
import { useEcosystemDashboard, useUserBadges, useMissions, useAchievements, useCheckin, useAiIntelligence, useXpHistory } from '@/hooks/use-ecosystem';
import { MembershipBenefitsCard } from '@/components/ecosystem/membership-benefits-card';
import { PlatformIntegrationsCard, SELLER_INTEGRATIONS } from '@/components/ecosystem/platform-integrations-card';
import { AiSuggestedMissions } from '@/components/ecosystem/ai-suggested-missions';
import { getCurrentPlan } from '@/lib/api/membership';
import { Sparkles, Target, Award, TrendingUp, Zap, Store, DollarSign, Package, AlertCircle, Crown, Megaphone, Users, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

export default function SellerEcosystemPage() {
  const [missionPeriod, setMissionPeriod] = useState('DAILY');
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useEcosystemDashboard();
  const { data: badges, isLoading: badgesLoading } = useUserBadges();
  const { data: missions, isLoading: missionsLoading } = useMissions(missionPeriod);
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: intelligence, isLoading: aiLoading } = useAiIntelligence();
  const { data: xpHistory, isLoading: xpLoading } = useXpHistory({ limit: 10 });
  const checkin = useCheckin();

  useEffect(() => {
    getCurrentPlan().then(setSubscription).catch((err) => console.error('Failed to load subscription:', err)).finally(() => setSubLoading(false));
  }, []);

  const handleCheckin = () => {
    checkin.mutate(undefined, {
      onSuccess: (data) => toast({ title: data.bonusEarned ? 'Streak bonus!' : 'Checked in!', description: `Day ${data.streakCount} streak` }),
      onError: () => toast({ title: 'Check-in failed', variant: 'destructive' }),
    });
  };

  if (dashError) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <EmptyState icon={AlertCircle} variant="error" title="Failed to load ecosystem" action={<Button variant="accent" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <DashboardPageHeader
            title="Ecosystem"
            description="Your seller rewards, reputation, and growth"
            actions={
              <div className="flex gap-2">
                <Link href="/seller/gocash"><Button variant="outline" size="sm"><Zap className="mr-1 h-3 w-3" />GOCASH</Button></Link>
                <Link href="/seller/tradgo"><Button variant="outline" size="sm"><Award className="mr-1 h-3 w-3" />TRADGO</Button></Link>
              </div>
            }
          />

          {dashLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : dashboard ? (
            <>
              <RewardStatistics
                totalXp={dashboard.totalXp}
                badges={dashboard.badges}
                currentStreak={dashboard.currentStreak}
                missionsCompleted={dashboard.completedMissions}
              />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <XPProgressCard
                      levelName={dashboard.level.name}
                      levelNumber={dashboard.level.levelNumber}
                      totalXp={dashboard.totalXp}
                      nextLevelXp={dashboard.nextLevelXp}
                      badgeIcon={dashboard.level.badgeIcon}
                      badgeColor={dashboard.level.badgeColor}
                    />

                    <DailyCheckinCard
                      checkedIn={dashboard.checkedInToday}
                      currentStreak={dashboard.currentStreak}
                      loading={dashLoading}
                      checkingIn={checkin.isPending}
                      onCheckin={handleCheckin}
                    />

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-blue-400" />
                          Seller Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Products</span>
                          <span className="font-medium text-white">{dashboard.totalXp > 0 ? 'Active' : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Level</span>
                          <span className="font-medium text-accent-500">{dashboard.level.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Streak</span>
                          <span className="font-medium text-white">{dashboard.currentStreak}d</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-orange-400" />
                          Missions
                        </CardTitle>
                        <MissionCategoryTabs active={missionPeriod} onChange={setMissionPeriod} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {missionsLoading ? (
                        <TableSkeleton rows={3} />
                      ) : !missions?.length ? (
                        <p className="py-6 text-center text-sm text-white/40">No active missions</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {missions.map((m) => <MissionCard key={m.id} mission={m} userProgress={m.userProgress} />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-purple-400" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {achievementsLoading ? (
                        <TableSkeleton rows={3} />
                      ) : !achievements?.length ? (
                        <p className="py-6 text-center text-sm text-white/40">No achievements available</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {achievements.slice(0, 6).map((a) => (
                            <AchievementCard
                              key={a.id}
                              achievement={a}
                              progress={a.userProgress?.progress}
                              targetCount={a.userProgress?.targetCount}
                              status={a.userProgress?.status}
                              completedAt={a.userProgress?.completedAt}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        Recent XP
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {xpLoading ? <TableSkeleton rows={4} /> : <RewardTimeline entries={xpHistory?.data ?? []} />}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-orange-400" />
                        Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {badgesLoading ? <TableSkeleton rows={2} /> : !badges?.length ? (
                        <EmptyState icon={Award} title="No badges earned yet" />
                      ) : (
                        badges.slice(0, 4).map((ub) => <BadgeCard key={ub.id} badge={ub.badge} earned earnedAt={ub.earnedAt} size="sm" />)
                      )}
                    </CardContent>
                  </Card>

                  <AiSuggestedMissions intelligence={intelligence} loading={aiLoading} role="seller" />

                  <MembershipBenefitsCard subscription={subscription} loading={subLoading} />

                  <PlatformIntegrationsCard links={SELLER_INTEGRATIONS} title="Seller Integrations" />

                  <RewardSummary intelligence={intelligence} loading={aiLoading} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
