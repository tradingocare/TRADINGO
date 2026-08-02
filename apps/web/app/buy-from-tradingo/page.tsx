import Link from 'next/link';
import {
  ShoppingCart,
  ShieldCheck,
  Search,
  ArrowRight,
  MessageSquare,
  Users,
  Star,
  Zap,
  FileSearch,
  Building2,
  CheckCircle2,
  BarChart3,
  Headphones,
  Microscope,
  ClipboardCheck,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { Testimonials } from '@/components/shared/testimonials';
import { Accordion } from '@/components/ui/accordion';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

const BUYER_BENEFITS = [
  {
    icon: '✅',
    title: 'Verified Suppliers Only',
    description: 'Every supplier is PAN, GST, and business-verified. No fly-by-night operators. No fake listings. Guaranteed.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered RFQ Matching',
    description: 'Describe your requirement once. Our AI matches you with the most relevant suppliers and sends you competitive quotes automatically.',
  },
  {
    icon: '📊',
    title: 'Competitive Price Comparison',
    description: 'Compare quotes from multiple suppliers side-by-side. See price breaks, delivery timelines, and seller ratings in one view.',
  },
  {
    icon: '🔒',
    title: 'Secure Escrow Payments',
    description: 'Your payment is held securely until you confirm delivery. Inspect goods, verify quality, then release payment with confidence.',
  },
  {
    icon: '🧪',
    title: 'Free Sample Program',
    description: 'Request samples from suppliers before committing to bulk orders. Most suppliers offer free samples with paid shipping.',
  },
  {
    icon: '🎧',
    title: 'Dedicated Support',
    description: 'Our buyer support team helps with supplier discovery, negotiation, dispute resolution, and logistics coordination.',
  },
];

const VERIFICATION_PROCESS = [
  {
    step: '01',
    title: 'PAN Verification',
    description: 'Permanent Account Number verified against government database to confirm legal identity.',
    icon: FileSearch,
  },
  {
    step: '02',
    title: 'GST Registration Check',
    description: 'GST certificate validated for authenticity, business type, and registration status.',
    icon: ClipboardCheck,
  },
  {
    step: '03',
    title: 'Business Address Confirmation',
    description: 'Physical address verified through document submission and geo-tagged photo verification.',
    icon: Building2,
  },
  {
    step: '04',
    title: 'Bank Account Validation',
    description: 'Cancelled cheque and bank statement reviewed. Payouts only to verified business accounts.',
    icon: BadgeCheck,
  },
  {
    step: '05',
    title: 'Ongoing Quality Monitoring',
    description: 'Supplier performance tracked through order fulfillment rates, quality scores, and buyer reviews.',
    icon: Microscope,
  },
];

const RFQ_STEPS = [
  {
    step: '1',
    title: 'Post Your Requirement',
    description: 'Describe what you need — product specs, quantity, budget, and delivery timeline. Add documents or drawings if needed.',
  },
  {
    step: '2',
    title: 'Get Matched Quotes',
    description: 'Our AI identifies the best-matched suppliers and sends your RFQ. Suppliers respond with competitive quotes within 24-48 hours.',
  },
  {
    step: '3',
    title: 'Compare & Shortlist',
    description: 'View quotes side-by-side. Compare pricing, delivery dates, payment terms, and seller ratings. Shortlist the best options.',
  },
  {
    step: '4',
    title: 'Negotiate & Close',
    description: 'Use built-in negotiation tools to discuss terms, request revisions, and finalize the deal. All conversations tracked on-platform.',
  },
  {
    step: '5',
    title: 'Pay Securely via Escrow',
    description: 'Payment is held in escrow until goods are delivered and inspected. Release payment only when you are satisfied.',
  },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: '100% Escrow Protection' },
  { icon: BadgeCheck, label: 'ISO 27001 Certified' },
  { icon: CheckCircle2, label: 'PCI DSS Compliant' },
  { icon: Star, label: '4.8/5 Buyer Satisfaction' },
];

const BUYER_TESTIMONIALS = [
  {
    quote: 'We were sourcing industrial packaging from 3 different states with inconsistent quality. TRADINGO helped us find a verified supplier in Gujarat who delivers 30% cheaper with consistent quality.',
    author: 'Vikram Singh',
    role: 'Procurement Head',
    company: 'Singh Packaging, Pune',
    rating: 5,
  },
  {
    quote: 'The RFQ system saved us weeks of vendor discovery. We posted our requirement for hydraulic pumps at 10 AM, had 8 quotes by 5 PM, and placed the order by Friday.',
    author: 'Ananya Gupta',
    role: 'Supply Chain Manager',
    company: 'Gupta Engineering, Chennai',
    rating: 5,
  },
  {
    quote: 'Escrow payments gave us the confidence to work with new suppliers. We have placed orders worth ₹2Cr+ through TRADINGO without a single dispute.',
    author: 'Rahul Joshi',
    role: 'Director of Operations',
    company: 'Joshi Auto Parts, Bengaluru',
    rating: 5,
  },
  {
    quote: 'The TradeServ quality inspection service is a lifesaver. We get third-party inspection reports before shipment, eliminating the guesswork entirely.',
    author: 'Neha Kapoor',
    role: 'Quality Assurance Lead',
    company: 'Kapoor Chemicals, Hyderabad',
    rating: 4,
  },
];

const FAQ_ITEMS = [
  {
    value: 'getting-started',
    title: 'How do I start buying on TRADINGO?',
    children:
      'Register as a buyer (free), complete your business profile, and start searching for products immediately. You can browse the catalog, post RFQs, or request quotes directly from supplier listings.',
  },
  {
    value: 'verification',
    title: 'How are suppliers verified?',
    children:
      'Every supplier undergoes a multi-step verification process including PAN validation, GST registration check, business address confirmation, and bank account verification. Premium suppliers also have site visits and quality audits.',
  },
  {
    value: 'payment-protection',
    title: 'How does escrow payment work?',
    children:
      'When you place an order, the payment is held in a secure escrow account. The supplier ships the goods. You inspect and confirm delivery. Only then is the payment released to the seller. Full protection against non-delivery and quality issues.',
  },
  {
    value: 'rfq',
    title: 'How does the RFQ process work?',
    children:
      'Post your requirement with detailed specifications. Our AI matches it with relevant suppliers who respond with quotes. You compare quotes, negotiate terms, and select the best offer. Average response time is under 24 hours.',
  },
  {
    value: 'logistics',
    title: 'Can TRADINGO help with logistics?',
    children:
      'Yes. Our integrated logistics network covers 29,000+ pin codes across India. We can arrange pan-India shipping with real-time tracking. You can also use your own logistics partners if preferred.',
  },
  {
    value: 'disputes',
    title: 'What if there is a dispute with a supplier?',
    children:
      'Our dedicated dispute resolution team mediates between buyers and suppliers. For orders under escrow, your payment is protected. We aim to resolve all disputes within 5 business days.',
  },
];

export default function BuyFromTradingoPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-24 pt-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% -10%, rgba(245, 158, 11, 0.08), transparent)',
          }}
        />
        <div className="container-main relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent">
              <ShieldCheck className="h-4 w-4" />
              Trusted by 3,50,000+ Buyers
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Source Verified Products from{' '}
              <span className="text-gradient">India&apos;s Best Suppliers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
              India&apos;s most trusted B2B marketplace for verified suppliers, competitive
              pricing, and secure transactions. Post your requirements and get matched with
              the best suppliers in your category.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register/buyer">
                <Button size="xl" className="w-full sm:w-auto">
                  Start Buying Free
                  <ShoppingCart className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/search">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Explore Products
                  <Search className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-text-tertiary">Free buyer registration. No minimum order quantity.</p>
          </div>
        </div>
      </section>

      {/* Trust Signals Row */}
      <section className="pb-20">
        <div className="container-main">
          <div className="grid gap-4 sm:grid-cols-4">
            {TRUST_SIGNALS.map((signal) => {
              const Icon = signal.icon;
              return (
                <div
                  key={signal.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:border-accent/20 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{signal.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Buyer Benefits */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Why Source on TRADINGO?"
            subtitle="Built for serious buyers who value quality, transparency, and reliability in every transaction."
          />
          <div className="mx-auto max-w-5xl">
            <FeatureCards features={BUYER_BENEFITS} columns={3} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Supplier Verification */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                <ShieldCheck className="h-8 w-8 text-btn-primary-text" />
              </div>
            </div>
            <SectionHeader
              title="Every Supplier Is Verified"
              subtitle="We don&apos;t let just anyone sell on TRADINGO. Every supplier goes through a rigorous multi-step verification process."
            />
          </AnimatedSection>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {VERIFICATION_PROCESS.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.step} className="border-border bg-surface transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <span className="mt-3 text-xs font-bold uppercase tracking-wider text-accent">{item.step}</span>
                      <h3 className="mt-2 text-sm font-bold text-text-primary">{item.title}</h3>
                      <p className="mt-1 text-xs text-text-secondary">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* How RFQ Works */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                <FileSearch className="h-8 w-8 text-btn-primary-text" />
              </div>
            </div>
            <SectionHeader
              title="Smart RFQ — Post Once, Get Multiple Quotes"
              subtitle="Stop calling suppliers one by one. Post your requirement once and let suppliers compete for your business."
            />
          </AnimatedSection>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {RFQ_STEPS.map((step) => (
                <Card key={step.step} className="border-border bg-surface transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                      {step.step}
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-text-primary">{step.title}</h3>
                    <p className="mt-2 text-xs text-text-secondary">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* TradeServ */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                <Users className="h-8 w-8 text-btn-primary-text" />
              </div>
            </div>
            <SectionHeader
              title="TradeServ — Professional Services for Buyers"
              subtitle="Get expert help at every stage of your procurement journey with our integrated professional services marketplace."
            />
          </AnimatedSection>
          <div className="mx-auto max-w-5xl">
            <FeatureCards
              features={[
                {
                  icon: '🔍',
                  title: 'Quality Inspection Services',
                  description: 'Third-party quality inspectors verify your goods before shipment. Get detailed reports with photos and measurements.',
                  badge: 'POPULAR',
                },
                {
                  icon: '📋',
                  title: 'Supplier Audits',
                  description: 'Professional auditors visit supplier facilities to verify capabilities, production capacity, and compliance.',
                },
                {
                  icon: '🚢',
                  title: 'Logistics & Freight Coordination',
                  description: 'End-to-end logistics management — from supplier pickup to delivery at your doorstep, pan-India.',
                },
                {
                  icon: '⚖️',
                  title: 'Legal & Contract Support',
                  description: 'Get expert help with purchase agreements, NDAs, and dispute resolution from our legal partners.',
                },
              ]}
              columns={2}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* TradeTalk */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                <MessageSquare className="h-8 w-8 text-btn-primary-text" />
              </div>
            </div>
            <SectionHeader
              title="TradeTalk — The Buyer Community"
              subtitle="Connect with thousands of procurement professionals. Share insights, read supplier reviews, and stay updated on market trends."
            />
          </AnimatedSection>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: 'Industry Discussions',
                  description: 'Join category-specific groups to discuss pricing trends, supplier experiences, and market intelligence.',
                },
                {
                  icon: Star,
                  title: 'Supplier Reviews',
                  description: 'Read and write honest reviews about suppliers. Help the community make informed sourcing decisions.',
                },
                {
                  icon: Users,
                  title: 'Professional Networking',
                  description: 'Connect with procurement peers, industry experts, and potential business partners across India.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="group border-border bg-surface transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="flex flex-col items-center p-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 transition-all duration-300 group-hover:bg-accent/20">
                        <Icon className="h-7 w-7 text-accent" />
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-text-primary">{item.title}</h3>
                      <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <Link href="/tradetalk">
                <Button size="lg" variant="outline">
                  Join TradeTalk Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Buyers Trust */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                <BarChart3 className="h-8 w-8 text-btn-primary-text" />
              </div>
              <SectionHeader
                title="Trusted by India&apos;s Leading Enterprises"
                subtitle="From MSMEs to Fortune 500 companies — thousands of businesses trust TRADINGO for their procurement needs."
              />
            </div>
          </AnimatedSection>
          <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '3.5L+', label: 'Active Buyers' },
              { value: '₹850Cr+', label: 'Monthly GMV' },
              { value: '98%', label: 'Delivery Success Rate' },
              { value: '4.8/5', label: 'Average Rating' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-sm transition-all duration-300 hover:border-accent/20 hover:shadow-lg"
              >
                <span className="text-4xl font-bold tracking-tight text-text-primary">
                  {stat.value}
                </span>
                <p className="mt-2 text-sm font-medium text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Testimonials */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="What Buyers Say About TRADINGO"
            subtitle="Join thousands of satisfied buyers who trust TRADINGO for their sourcing needs."
          />
          <Testimonials testimonials={BUYER_TESTIMONIALS} />
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about buying on TRADINGO."
          />
          <div className="mx-auto max-w-3xl">
            <Accordion items={FAQ_ITEMS} type="single" defaultValue="getting-started" />
          </div>
        </div>
      </section>

      <CTABlock
        title="Start Sourcing Smarter"
        subtitle="Join 3,50,000+ buyers already sourcing on TRADINGO. Get better prices, verified suppliers, and complete payment protection."
        primaryLabel="Start Buying Free"
        primaryHref="/register/buyer"
        secondaryLabel="Browse Products"
        secondaryHref="/search"
        variant="accent"
      />
    </>
  );
}
