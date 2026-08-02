'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { LevelCard } from '@/components/ecosystem/level-card';
import { BadgeCard } from '@/components/ecosystem/badge-card';
import { MissionCard } from '@/components/ecosystem/mission-card';
import { useEcoAdminDashboard, useEcoAdminXpChart, useEcosystemLevels, useBadges, useMissions } from '@/hooks/use-ecosystem';
import { ecoSeedData } from '@/lib/api/ecosystem';
import { Sparkles, Users, Trophy, Zap, Target, Award, CheckCircle, Activity, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminEcosystemPage() {
  const [seeding, setSeeding] = useState(false);

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useEcoAdminDashboard();
  const { data: xpChart, isLoading: chartLoading } = useEcoAdminXpChart(30);
  const { data: levels, isLoading: levelsLoading } = useEcosystemLevels();
  const { data: badges, isLoading: badgesLoading } = useBadges(true);
  const { data: missions, isLoading: missionsLoading } = useMissions();

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await ecoSeedData();
      toast({ title: 'Seed data created' });
    } catch {
      toast({ title: 'Seed failed (may already exist)', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  if (dashError) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, color-mix(in srgb, var(--accent) 8%, transparent), transparent)' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-status-error" />
              <p className="text-lg font-medium text-text-primary">Failed to load ecosystem admin</p>
              <Button variant="accent" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, color-mix(in srgb, var(--accent) 8%, transparent), transparent)' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DashboardPageHeader title="Ecosystem Admin" description="Manage levels, badges, missions, and view analytics" />
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              {seeding ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
              Seed Data
            </Button>
          </div>

          {dashLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : dashboard ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Users className="h-5 w-5 text-accent" /></div>
                    <div><p className="text-xs text-text-tertiary">Total Users</p><p className="text-xl font-bold text-text-primary">{dashboard.totalUsers.toLocaleString()}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Zap className="h-5 w-5 text-accent" /></div>
                    <div><p className="text-xs text-text-tertiary">Total XP Issued</p><p className="text-xl font-bold text-text-primary">{dashboard.totalXp.toLocaleString()}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-success/10"><CheckCircle className="h-5 w-5 text-status-success" /></div>
                    <div><p className="text-xs text-text-tertiary">Check-ins</p><p className="text-xl font-bold text-text-primary">{dashboard.totalCheckins.toLocaleString()}</p></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-info/10"><Award className="h-5 w-5 text-status-info" /></div>
                    <div><p className="text-xs text-text-tertiary">Badges Issued</p><p className="text-xl font-bold text-text-primary">{dashboard.totalBadges.toLocaleString()}</p></div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-accent" />
                        XP Issued (30 days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartLoading ? (
                        <div className="flex items-center justify-center py-10"><LoadingSpinner size="default" /></div>
                      ) : xpChart?.length ? (
                        <div className="h-48">
                          <div className="flex h-full items-end gap-1">
                            {xpChart.map((point, i) => {
                              const maxVal = Math.max(...xpChart.map((p) => p.amount));
                              const height = maxVal > 0 ? (point.amount / maxVal) * 100 : 0;
                              return (
                                <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
                                  <div
                                    className="w-full rounded-t bg-gradient-to-t from-accent/40 to-accent/80 transition-all hover:from-accent/60 hover:to-accent"
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                    title={`${point.date}: ${point.amount} XP`}
                                  />
                                  <span className="mt-1 text-[8px] text-text-tertiary">{point.date.slice(5)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="py-6 text-center text-sm text-text-tertiary">No XP data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-accent" />
                        Missions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {missionsLoading ? (
                        <div className="flex items-center justify-center py-6"><LoadingSpinner size="sm" /></div>
                      ) : !missions?.length ? (
                        <p className="py-6 text-center text-sm text-text-tertiary">No missions created. Use API or seed data.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {missions.map((m) => <MissionCard key={m.id} mission={m} compact />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-accent" />
                        Levels
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {levelsLoading ? (
                        <div className="flex items-center justify-center py-6"><LoadingSpinner size="sm" /></div>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {levels?.map((l) => <LevelCard key={l.id} name={l.name} levelNumber={l.levelNumber} minXP={l.minXP} maxXP={l.maxXP} badgeIcon={l.badgeIcon} badgeColor={l.badgeColor} />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-accent" />
                        Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {badgesLoading ? (
                        <div className="flex items-center justify-center py-6"><LoadingSpinner size="sm" /></div>
                      ) : !badges?.length ? (
                        <p className="py-4 text-center text-xs text-text-tertiary">No badges. Seed data to create.</p>
                      ) : (
                        badges.map((b) => <BadgeCard key={b.id} badge={b} size="sm" />)
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-status-success" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-text-tertiary">Missions</span><span className="font-medium text-text-primary">{dashboard.totalMissions}</span></div>
                      <div className="flex justify-between"><span className="text-text-tertiary">Achievements</span><span className="font-medium text-text-primary">{dashboard.totalAchievements}</span></div>
                      <div className="flex justify-between"><span className="text-text-tertiary">Levels</span><span className="font-medium text-text-primary">{levels?.length ?? 0}</span></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
