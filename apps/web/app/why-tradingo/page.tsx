import type { Metadata } from 'next';
import { Shield, Zap, Award, Globe, Headphones, CheckCircle2, XCircle, BarChart3, DollarSign, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Why TRADINGO | India\'s First TEM E-Marketplace',
};

const differentiators = [
  {
    icon: Shield,
    title: 'Trust & Security',
    description: 'Every transaction is protected by our escrow system. All sellers and buyers undergo mandatory KYC verification. Dispute resolution handled by our dedicated team. Your data is encrypted and secure.',
    details: [
      'Escrow-protected payments — funds released only on delivery confirmation',
      'Mandatory KYC and business verification for all traders',
      'End-to-end encryption for all communications and transactions',
      'Dedicated dispute resolution team for fair conflict handling',
    ],
  },
  {
    icon: Zap,
    title: 'AI-Powered Matching',
    description: 'Our intelligent algorithms connect you with the right trading partners automatically. Save time and discover opportunities you would otherwise miss.',
    details: [
      'Smart RFQ matching based on product, price, location, and reputation',
      'AI-driven price intelligence and market trend analysis',
      'Automated product categorization and tagging for better discovery',
      'Personalized recommendations tailored to your trading history',
    ],
  },
  {
    icon: Award,
    title: 'Rewards Ecosystem',
    description: 'Earn GOCASH on every successful trade. Participate in TRADGO races, climb leaderboards, and unlock exclusive platform benefits.',
    details: [
      'Earn 2-5% GOCASH back on every completed transaction',
      'TRADGO trading races with badges, trophies, and prizes',
      'Tiered loyalty program — Bronze, Silver, Gold with increasing perks',
      'Redeem GOCASH for listing boosts, analytics, and premium features',
    ],
  },
  {
    icon: Globe,
    title: 'Pan-India Network',
    description: 'Connect with buyers and sellers across 500+ cities. Break geographical barriers and expand your business nationwide.',
    details: [
      'Active presence in 500+ cities across India',
      'Localized market access with city-wise browsing',
      'Connected logistics network for seamless pan-India delivery',
      'Multi-language support for regional traders',
    ],
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Our support team is available 24/7 to help you with every aspect of your trading journey.',
    details: [
      '24/7 customer support via phone, email, and live chat',
      'Dedicated relationship managers for business plan subscribers',
      'Comprehensive help center with guides and FAQs',
      'Average response time under 2 hours for all queries',
    ],
  },
  {
    icon: Shield,
    title: 'Zero-Risk Trading',
    description: 'Trade with complete confidence. Our multi-layer protection ensures you never lose money on a transaction.',
    details: [
      'Full escrow protection — pay only when you confirm satisfaction',
      'Seller performance tracking and rating system',
      'Product quality verification and authenticity checks',
      'Money-back guarantee on eligible transactions',
    ],
  },
];

const comparisonData = [
  { aspect: 'Trust Verification', traditional: 'No verification, high fraud risk', tradingo: 'Mandatory KYC & business verification' },
  { aspect: 'Payment Security', traditional: 'Direct payments, no protection', tradingo: 'Escrow-protected transactions' },
  { aspect: 'Partner Discovery', traditional: 'Manual networking, limited reach', tradingo: 'AI-powered smart matching, pan-India reach' },
  { aspect: 'Rewards', traditional: 'None', tradingo: 'GOCASH cashback + gamified rewards' },
  { aspect: 'Dispute Resolution', traditional: 'No formal process', tradingo: 'Dedicated team with structured resolution' },
  { aspect: 'Market Insights', traditional: 'Limited to personal network', tradingo: 'AI-driven price intelligence & trends' },
  { aspect: 'Geographic Reach', traditional: 'Local/regional', tradingo: '500+ cities across India' },
  { aspect: 'Support', traditional: 'None or limited', tradingo: '24/7 support + dedicated managers' },
  { aspect: 'Platform Fees', traditional: 'Varies, often hidden', tradingo: 'Transparent pricing, free tier available' },
];

export default function WhyTradingoPage() {
  return (
    <>
      <PageHeader
        title="Why TRADINGO?"
        description="Discover what makes TRADINGO the most trusted B2B trading platform in India."
      />

      {/* Differentiators */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="What Sets Us Apart"
            subtitle="Six reasons why thousands of businesses choose TRADINGO."
          />
          <div className="mx-auto max-w-5xl space-y-16">
            {differentiators.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="sticky top-24">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <item.icon className="h-7 w-7" />
                      </div>
                      <h2 className="mt-4 text-2xl font-bold text-text-primary dark:text-dark-text-primary">{item.title}</h2>
                      <p className="mt-3 text-text-secondary dark:text-dark-text-secondary leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      {item.details.map((detail) => (
                        <div key={detail} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                          <span className="text-text-secondary dark:text-dark-text-secondary">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Comparison Table */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="TRADINGO vs Traditional Trading"
              subtitle="See how TRADINGO compares to traditional B2B trading methods."
            />
            <div className="overflow-x-auto rounded-xl border border-border dark:border-dark-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary dark:bg-dark-surface-secondary dark:border-dark-border">
                    <th className="px-6 py-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Aspect</th>
                    <th className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Traditional Trading
                      </div>
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        TRADINGO
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr
                      key={row.aspect}
                      className={i % 2 === 0 ? 'bg-surface dark:bg-dark-surface' : 'bg-surface-secondary/50 dark:bg-dark-surface-secondary/50'}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-text-primary dark:text-dark-text-primary">{row.aspect}</td>
                      <td className="px-6 py-4 text-sm text-red-600/80 dark:text-red-400/80">{row.traditional}</td>
                      <td className="px-6 py-4 text-sm text-green-600/80 dark:text-green-400/80">{row.tradingo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* Trust Badges */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Built on Trust"
                subtitle="Every aspect of TRADINGO is designed to build and maintain trust between trading partners."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { icon: Shield, label: 'Escrow Protection', desc: 'Your funds are safe until you confirm satisfaction' },
                  { icon: Zap, label: 'AI Verification', desc: 'Automated identity and business verification' },
                  { icon: BarChart3, label: 'Transparent Ratings', desc: 'Real seller performance data you can rely on' },
                  { icon: Globe, label: 'Regulatory Compliant', desc: 'Fully compliant with Indian trade regulations' },
                  { icon: DollarSign, label: 'No Hidden Fees', desc: '100% transparent pricing with no surprises' },
                  { icon: Clock, label: '24/7 Monitoring', desc: 'Real-time fraud detection and transaction monitoring' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{item.label}</h3>
                      <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <CTABlock
        title="Start Trading"
        subtitle="Join India's most trusted B2B marketplace. Create your free account and experience the TRADINGO difference."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Learn More"
        secondaryHref="/about-tradingo"
        variant="accent"
      />
    </>
  );
}
