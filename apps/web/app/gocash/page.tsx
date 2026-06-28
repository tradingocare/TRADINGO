import type { Metadata } from 'next';
import { Sparkles, Award } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GOCASH_EARN_FEATURES, GOCASH_REDEMPTIONS, GOCASH_TIERS, GOCASH_EARNING_RATES } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'GOCASH Rewards | TRADINGO',
  description:
    'Earn GOCASH on every trade. Redeem for platform benefits, discounts, and premium features on TRADINGO.',
};

const earnFeatures = GOCASH_EARN_FEATURES;

const redemptionOptions = GOCASH_REDEMPTIONS;

const loyaltyTiers = GOCASH_TIERS;

const earningRates = GOCASH_EARNING_RATES;

export default function GocashPage() {
  return (
    <>
      <PageHeader
        title="GOCASH Rewards Program"
        description="Earn GOCASH on every trade. Redeem for platform benefits, discounts, and premium features."
      />

      {/* Hero Intro */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-xl">
                <Award className="h-10 w-10" />
              </div>
              <h2 className="mt-8 text-3xl font-bold sm:text-4xl dark:text-dark-text-primary">
                Earn Rewards on Every Trade
              </h2>
              <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                GOCASH is TRADINGO&apos;s proprietary rewards currency designed to put money back in your pocket.
                Every successful trade on the platform earns you GOCASH — from instant purchases via TRADBUY
                to negotiated deals through RFQ. The more you trade, the more you earn.
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
            title="How GOCASH Works"
            subtitle="Three simple steps to start earning and redeeming rewards."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={earnFeatures} columns={3} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Earning Rates Table */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Earning Rates"
            subtitle="Different transaction types earn different GOCASH rates. Here's how it breaks down."
          />
          <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border shadow-sm dark:border-dark-border">
            <table className="w-full">
              <thead>
                <tr className="bg-accent-50 dark:bg-accent-900/20">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary">Transaction Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary">GOCASH Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary">Earning Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-dark-border">
                {earningRates.map((row) => (
                  <tr key={row.type} className="bg-surface hover:bg-surface-secondary/50 dark:bg-dark-surface dark:hover:bg-dark-surface-secondary/50">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary dark:text-dark-text-primary">{row.type}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-amber-600 dark:text-amber-400">{row.rate}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">{row.minGocash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Separator />

      {/* Redemption Options */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Redeem Your GOCASH"
            subtitle="Powerful platform benefits you can unlock with your accumulated rewards."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={redemptionOptions} columns={4} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Loyalty Tiers */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Loyalty Tiers"
            subtitle="Your GOCASH balance determines your tier. Higher tiers unlock better earning rates and exclusive perks."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loyaltyTiers.map((tier) => (
              <Card
                key={tier.tier}
                className={`relative border ${tier.border} ${tier.bg} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-4 py-1 text-xs">
                      Most Common
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${tier.color}`}>
                    <Award className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">{tier.tier}</CardTitle>
                  <CardDescription className="font-semibold text-amber-600 dark:text-amber-400">
                    {tier.min}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 inline-block rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                    {tier.earnRate} earning rate
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Separator />
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="GOCASH FAQ"
            subtitle="Common questions about the GOCASH rewards program."
          />
          <div className="mx-auto max-w-3xl space-y-6">
            {[
              {
                q: 'How do I earn GOCASH?',
                a: 'You earn GOCASH automatically on every successful trade completed on TRADINGO. The rate depends on the transaction type — TRADBUY purchases earn 2%, RFQ deals earn 3%, and bulk transactions earn up to 5%.',
              },
              {
                q: 'Does GOCASH expire?',
                a: 'No, GOCASH rewards do not expire as long as your account remains active. Accumulate them over time and redeem whenever you need.',
              },
              {
                q: 'Can I transfer GOCASH to another account?',
                a: 'GOCASH is tied to your account and cannot be transferred. However, if you have multiple business accounts, contact our support team for enterprise solutions.',
              },
              {
                q: 'How do I check my GOCASH balance?',
                a: 'Your GOCASH balance is displayed on your seller dashboard and account settings page. You can track earnings, redemptions, and tier progression in real-time.',
              },
              {
                q: 'What happens when I reach a new loyalty tier?',
                a: 'You are automatically upgraded to the next tier as soon as your GOCASH balance crosses the threshold. New benefits apply immediately to all new transactions.',
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
        title="Start Earning GOCASH"
        subtitle="Create your free account and start earning GOCASH rewards on every trade today."
        primaryLabel="Get Started Free"
        primaryHref="/register"
        secondaryLabel="Learn About Trading"
        secondaryHref="/trading"
        variant="accent"
      />
    </>
  );
}
