import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { FeatureCards } from '@/components/shared/feature-cards';
import { Separator } from '@/components/ui/separator';

const benefits = [
  { icon: 'Gift', title: 'Earn GOCASH Rewards', description: 'Get rewarded every time someone you refer completes their first trade. No cap on earnings.' },
  { icon: 'TrendingUp', title: 'Unlimited Referrals', description: 'Refer as many businesses as you want. Each successful referral earns you rewards.' },
  { icon: 'Award', title: 'Bonus Milestones', description: 'Unlock special bonuses when you reach 5, 10, 25, and 50 successful referrals.' },
  { icon: 'Target', title: 'Track Everything', description: 'Real-time dashboard shows your referrals, rewards, and earnings at a glance.' },
  { icon: 'Users', title: 'Smart Sharing', description: 'Share via link, QR code, or social media. Your unique code works everywhere.' },
  { icon: 'Zap', title: 'Instant Rewards', description: 'Rewards are credited to your GOCASH wallet automatically when your referral trades.' },
];

const steps = [
  { number: '01', title: 'Get Your Code', description: 'Generate your unique referral code from your dashboard.' },
  { number: '02', title: 'Share It', description: 'Send your code or referral link to other businesses.' },
  { number: '03', title: 'They Join', description: 'New users sign up using your referral code.' },
  { number: '04', title: 'Earn Rewards', description: 'Get GOCASH rewards when they complete their first trade.' },
];

export default function ReferPage() {
  return (
    <>
      <PageHeader
        title="Refer & Earn — TRADINGO"
        description="Invite other businesses to TRADINGO and earn rewards every time they trade."
      />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Why Refer?"
              subtitle="Grow the marketplace and earn rewards for every successful referral."
            />
            <div className="mt-10">
              <FeatureCards features={benefits} columns={3} />
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="How It Works"
              subtitle="Getting started is easy. Just follow these four steps."
            />
            <div className="mt-12 mx-auto grid max-w-4xl gap-6 md:grid-cols-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative flex flex-col items-center rounded-xl border border-border bg-surface p-6 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-8 text-center">
              <SectionHeader
                title="Frequently Asked Questions"
                subtitle="Everything you need to know about the referral program."
              />
              <div className="mt-8 space-y-6 text-left">
                <div>
                  <h4 className="font-medium text-text-primary">Who can participate?</h4>
                  <p className="mt-1 text-sm text-text-secondary">Any registered TRADINGO user (Buyer or Seller) with an active account can generate a referral code.</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">How much can I earn?</h4>
                  <p className="mt-1 text-sm text-text-secondary">Each successful referral earns you GOCASH rewards deposited directly to your wallet. There is no upper limit.</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">How are referrals tracked?</h4>
                  <p className="mt-1 text-sm text-text-secondary">Every referral is tracked through your unique code or link. You can monitor all activity in your referral dashboard.</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">When do I get rewarded?</h4>
                  <p className="mt-1 text-sm text-text-secondary">Rewards are credited automatically when your referral completes their first qualifying trade on TRADINGO.</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Ready to Start Referring?"
        subtitle="Generate your referral code and start earning rewards today."
        primaryLabel="Go to Dashboard"
        primaryHref="/login"
        secondaryLabel="Learn More"
        secondaryHref="/features"
        variant="accent"
      />
    </>
  );
}
