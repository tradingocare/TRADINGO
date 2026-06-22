import type { Metadata } from 'next';
import { Check, X, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { PricingCards } from '@/components/shared/pricing-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
export const metadata: Metadata = {
  title: 'Seller Plans | TRADINGO',
  description:
    'Choose the right plan for your business. Start free and upgrade as you grow on TRADINGO.',
};

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'month',
    description: 'Perfect for new sellers exploring the marketplace.',
    features: [
      'List up to 10 products',
      'Basic analytics dashboard',
      'Standard email support',
      'Basic RFQ access',
      '1x GOCASH earning rate',
      'Standard product visibility',
    ],
    href: '/register',
  },
  {
    name: 'Business',
    price: '₹999',
    period: 'month',
    description: 'For growing businesses ready to scale their operations.',
    features: [
      'Unlimited product listings',
      'Advanced analytics with trends',
      'Priority support (24/7 chat)',
      'AI-powered RFQ matching',
      '2x GOCASH earning rate',
      'TRADGO race access',
      'Listing boost credits (monthly)',
      'Bulk product upload',
    ],
    href: '/register?plan=business',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₹2,499',
    period: 'month',
    description: 'For large enterprises with high-volume trading needs.',
    features: [
      'Everything in Business',
      'Dedicated account manager',
      'API access for bulk operations',
      '3x GOCASH earning rate',
      'Custom integrations',
      'White-label storefront',
      'Zero platform fees',
      'Exclusive TRADGO events',
      'SLA guarantee',
    ],
    href: '/register?plan=enterprise',
    highlight: 'Best Value',
  },
];

const compareFeatures = [
  { name: 'Product Listings', starter: '10', business: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Analytics', starter: 'Basic', business: 'Advanced', enterprise: 'Advanced + Custom' },
  { name: 'Support', starter: 'Email', business: '24/7 Priority', enterprise: 'Dedicated Manager' },
  { name: 'RFQ Access', starter: 'Basic', business: 'AI-Powered', enterprise: 'AI-Powered + Priority' },
  { name: 'GOCASH Rate', starter: '1x', business: '2x', enterprise: '3x' },
  { name: 'TRADGO Access', starter: false, business: true, enterprise: true },
  { name: 'API Access', starter: false, business: false, enterprise: true },
  { name: 'White-Label', starter: false, business: false, enterprise: true },
  { name: 'Listing Boosts', starter: false, business: 'Monthly Credits', enterprise: 'Unlimited' },
  { name: 'SLA Guarantee', starter: false, business: false, enterprise: true },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades apply at the start of the next billing cycle.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'All paid plans come with a 14-day free trial. No credit card required. Cancel anytime during the trial period with no charges.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, debit cards, UPI, net banking, and wallet payments. Enterprise plans can opt for quarterly or annual invoicing.',
  },
  {
    q: 'Can I have multiple users on one account?',
    a: 'Business plans include up to 3 team members. Enterprise plans include up to 10 team members with role-based access control.',
  },
  {
    q: 'What happens to my products if I downgrade?',
    a: 'If you downgrade from Business to Starter, your listings exceeding the 10-product limit will be hidden until you upgrade again. No data is lost.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes, annual billing saves you 20% on both Business and Enterprise plans. Pay for 10 months and get 2 months free.',
  },
];

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
