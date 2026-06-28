import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { Zap, Star, Trophy, Medal, Crown, Shield, Globe } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TRADGO_BADGES, TRADGO_PRIZES, TRADGO_RACE_FEATURES } from '@/data/master-data';
export const metadata: Metadata = {
  title: 'TRADGO — Trading Races | TRADINGO',
  description:
    'Turn trading into a sport. Compete, earn badges, and climb the leaderboard on TRADINGO TRADGO.',
};

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Star, Crown, Trophy, Shield, Globe, Zap,
};

const BADGE_GRADIENTS = [
  'from-amber-400 to-yellow-500',
  'from-yellow-600 to-amber-700',
  'from-rose-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-teal-400 to-cyan-500',
  'from-amber-500 to-orange-500',
];

const badges = TRADGO_BADGES.map((b, i) => ({
  icon: ICON_MAP[b.icon] || Zap,
  title: b.name,
  description: b.description,
  color: BADGE_GRADIENTS[i] || 'from-blue-500 to-cyan-500',
}));

const PRIZE_ICONS = [Trophy, Medal, Medal];
const PRIZE_RANK_LABELS = ['1st Place', '2nd Place', '3rd Place'];
const PRIZE_TEXT_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const PRIZE_BG_COLORS = [
  'bg-yellow-50 dark:bg-yellow-900/10',
  'bg-gray-50 dark:bg-gray-900/10',
  'bg-amber-50 dark:bg-amber-900/10',
];
const PRIZE_BORDER_COLORS = [
  'border-yellow-300 dark:border-yellow-700',
  'border-gray-300 dark:border-gray-700',
  'border-amber-200 dark:border-amber-800',
];

const leaderboardPrizes = TRADGO_PRIZES.map((p, i) => ({
  rank: PRIZE_RANK_LABELS[i] || `${p.rank}th Place`,
  prize: p.prize,
  icon: PRIZE_ICONS[i] || Trophy,
  color: PRIZE_TEXT_COLORS[i] || 'text-accent-500',
  bg: PRIZE_BG_COLORS[i] || 'bg-accent-50 dark:bg-accent-900/10',
  border: PRIZE_BORDER_COLORS[i] || 'border-accent-200 dark:border-accent-800',
}));

const raceFeatures = TRADGO_RACE_FEATURES;

export default function TradgoPage() {
  return (
    <>
      <PageHeader
        title="TRADGO Trading Races"
        description="Turn trading into a sport. Compete, earn badges, and climb the leaderboard."
      />

      {/* Concept Section */}
      <section className="py-20 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-xl">
                <Zap className="h-10 w-10" />
              </div>
              <h2 className="mt-8 text-3xl font-bold sm:text-4xl dark:text-dark-text-primary">
                What is TRADGO?
              </h2>
              <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                TRADGO transforms the trading experience into an exciting, competitive sport. Instead of
                just buying and selling, you participate in time-bound trading races, compete against other
                traders, earn achievement badges, and climb the global leaderboard. Every trade you make
                earns you points — speed, volume, consistency, and deal quality all contribute to your score.
                Top performers at the end of each race period win real rewards: GOCASH prizes, premium plan
                upgrades, and exclusive recognition across the TRADINGO community.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* How It Works */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="How TRADGO Works"
            subtitle="Three simple steps to start racing and winning."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={raceFeatures} columns={3} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Badges */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Achievement Badges"
            subtitle="Earn badges by reaching trading milestones. Each badge represents a unique achievement."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card key={badge.title} className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${badge.color}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-lg">{badge.title}</CardTitle>
                    <CardDescription className="text-base">{badge.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Leaderboard Concept */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Leaderboard & Rewards"
            subtitle="Race periods run monthly. Top 10 traders win exciting prizes."
          />
          <div className="mx-auto max-w-3xl space-y-4">
            {leaderboardPrizes.map((prize) => {
              const Icon = prize.icon;
              return (
                <div
                  key={prize.rank}
                  className={`flex items-center gap-6 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${prize.bg} ${prize.border}`}
                >
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${prize.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{prize.rank}</h3>
                    <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{prize.prize}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* How to Join */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="How to Join TRADGO"
                subtitle="Getting started with TRADGO races is easy."
              />
              <div className="grid gap-6 sm:grid-cols-4">
                {[
                  { step: '1', title: 'Register', desc: 'Create your free TRADINGO account' },
                  { step: '2', title: 'Opt-In', desc: 'Enable TRADGO in your dashboard settings' },
                  { step: '3', title: 'Trade', desc: 'Conduct trades as usual — points accrue automatically' },
                  { step: '4', title: 'Win', desc: 'Leaderboard updates in real-time. Top ranks win prizes' },
                ].map((item) => (
                  <div key={item.step} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                      {item.step}
                    </div>
                    <h3 className="mt-3 font-semibold text-text-primary dark:text-dark-text-primary">{item.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <Separator />
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="TRADGO FAQ"
            subtitle="Common questions about trading races."
          />
          <div className="mx-auto max-w-3xl space-y-6">
            {[
              {
                q: 'How long does a TRADGO race last?',
                a: 'Each race period runs for one calendar month. At the end of each month, winners are announced and prizes are distributed within 7 days.',
              },
              {
                q: 'Can I participate in multiple races?',
                a: 'TRADGO races run continuously. Once you opt-in, you are automatically enrolled in every monthly race. No need to re-register each time.',
              },
              {
                q: 'How are points calculated?',
                a: 'Points are awarded based on four factors: speed (time from order to completion), volume (total trade value), consistency (trading frequency), and deal quality (success rate and ratings).',
              },
              {
                q: 'Do I need a paid plan to join?',
                a: 'No, TRADGO races are open to all TRADINGO users. However, Business and Enterprise plan members earn bonus points and have access to exclusive races.',
              },
              {
                q: 'When are prizes distributed?',
                a: 'Prizes are distributed within 7 business days after the race period ends. GOCASH is credited directly to your wallet, and plan upgrades are applied automatically.',
              },
            ].map((faq, i) => (
              <AnimatedSection key={faq.q} delay={i * 50}>
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                  <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{faq.q}</h3>
                  <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">{faq.a}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CTABlock
        title="Join TRADGO"
        subtitle="Start trading, earn badges, and compete for monthly prizes. Turn every trade into a victory."
        primaryLabel="Get Started Free"
        primaryHref="/register"
        secondaryLabel="Explore Badges"
        secondaryHref="/tradhexa"
        variant="accent"
      />
    </>
  );
}
