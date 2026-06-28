import type { Metadata } from 'next';
import { Check, X, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { PricingCards } from '@/components/shared/pricing-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { SELLER_PRICING_PLANS, WHY_COMPARISON, SELLER_PLANS_FAQ } from '@/data/master-data';
export const metadata: Metadata = {
  title: 'Seller Plans | TRADINGO',
  description:
    'Choose the right plan for your business. Start free and upgrade as you grow on TRADINGO.',
};

const plans = SELLER_PRICING_PLANS.map(p => ({
  name: p.name,
  price: p.price === '₹0' ? 'Free' : p.price,
  period: p.period === 'forever' ? 'month' : p.period.replace('/', ''),
  description: p.description,
  features: p.features,
  popular: p.popular,
  href: '/register',
  ...(p.name === 'Enterprise' ? { highlight: 'Best Value' } : {}),
}));

const compareFeatures = WHY_COMPARISON.map(c => ({
  name: c.feature,
  starter: c.others,
  business: c.tradindo,
  enterprise: c.tradindo,
}));

const faqs = SELLER_PLANS_FAQ.map(f => ({ q: f.question, a: f.answer }));

const CheckIcon = () => <Check className="h-5 w-5 text-accent-500" />;
const CrossIcon = () => <X className="h-5 w-5 text-red-400" />;

export default function SellerPlansPage() {
  return (
    <>
      <PageHeader
        title="Seller Plans & Pricing"
        description="Choose the right plan for your business. Start free and upgrade as you grow."
      />

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container-main">
          <PricingCards plans={plans} />
        </div>
      </section>

      <Separator />

      {/* Feature Comparison Table */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Feature Comparison"
            subtitle="See exactly what you get with each plan."
          />
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border shadow-sm dark:border-dark-border">
            <table className="w-full">
              <thead>
                <tr className="bg-accent-50 dark:bg-accent-900/20">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary dark:text-dark-text-primary">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-accent-500 dark:text-accent-400">Business</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary dark:text-dark-text-primary">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-dark-border">
                {compareFeatures.map((feature) => (
                  <tr key={feature.name} className="bg-surface hover:bg-surface-secondary/30 dark:bg-dark-surface dark:hover:bg-dark-surface-secondary/30">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary dark:text-dark-text-primary">{feature.name}</td>
                    <td className="px-6 py-4 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? <CheckIcon /> : <CrossIcon />
                      ) : (
                        feature.starter
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-accent-500 dark:text-accent-400">
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? <CheckIcon /> : <CrossIcon />
                      ) : (
                        feature.business
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? <CheckIcon /> : <CrossIcon />
                      ) : (
                        feature.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about our plans and pricing."
          />
          <div className="mx-auto max-w-3xl space-y-6">
            {faqs.map((faq, i) => (
              <AnimatedSection key={faq.q} delay={i * 50}>
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{faq.q}</h3>
                      <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CTABlock
        title="Start Your Free Trial"
        subtitle="No credit card required. Start with the Starter plan free forever, or try Business free for 14 days."
        primaryLabel="Get Started Free"
        primaryHref="/register"
        secondaryLabel="Compare Plans"
        secondaryHref="#"
        variant="accent"
      />
    </>
  );
}
