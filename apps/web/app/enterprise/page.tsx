import { PageHeader } from '@/components/shared/page-header'
import { CheckCircle, ArrowRight, Zap, Shield, Users, Headphones, Globe, BarChart3 } from 'lucide-react'

const plans = [
  {
    name: 'Growth',
    price: '₹49,999',
    period: '/year',
    description: 'For growing businesses ready to scale their procurement.',
    features: [
      'Up to 50 orders/month',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Dedicated account manager',
    ],
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '₹1,49,999',
    period: '/year',
    description: 'For large organizations with custom procurement needs.',
    features: [
      'Unlimited orders',
      '24/7 premium support',
      'Custom integrations',
      'Bulk order management',
      'SLA guarantees',
      'White-label options',
      'Multi-user accounts',
    ],
    highlighted: true,
  },
  {
    name: 'Custom',
    price: 'Contact Us',
    period: '',
    description: 'Tailored solutions for industry-specific requirements.',
    features: [
      'Everything in Enterprise',
      'Custom workflows',
      'Dedicated infrastructure',
      'On-site training',
      'Compliance management',
    ],
    highlighted: false,
  },
]

const benefits = [
  { icon: Zap, title: 'Faster Procurement', description: 'Streamline your entire procurement workflow with AI-powered matching.' },
  { icon: Shield, title: 'Enterprise Security', description: 'SOC 2 compliant with end-to-end encryption and audit trails.' },
  { icon: Users, title: 'Multi-User Access', description: 'Role-based access control for your entire procurement team.' },
  { icon: Headphones, title: 'Priority Support', description: 'Dedicated support with guaranteed response times.' },
  { icon: Globe, title: 'Global Reach', description: 'Access suppliers across 500+ cities in India.' },
  { icon: BarChart3, title: 'Advanced Analytics', description: 'Real-time insights into your procurement spending and trends.' },
]

const enterpriseAccents = ['#3D8BFF', '#F59E0B', '#8B5CF6'];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-bg-base">
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Enterprise Plans"
          description="Powerful procurement solutions for businesses of every scale."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, idx) => {
            const accent = enterpriseAccents[idx % 3];
            return (
            <div key={plan.name}
              className={`group relative overflow-hidden rounded-[22px] p-6 sm:p-8 border border-border bg-surface transition-all duration-300 ${
                plan.highlighted ? 'ring-2 ring-accent/50' : ''
              }`}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(600px circle at 30% 50%, ${accent}18, transparent 50%)` }} />
              <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `inset 0 0 0 1px ${accent}35, 0 0 20px ${accent}10` }} />
              <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}CC, ${accent}66)` }} />
                <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `0 0 12px ${accent}` }} />
              </div>
              <div className="relative z-10 pl-1">
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-btn-primary-text z-20">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                {plan.period && <span className="text-sm text-text-secondary">{plan.period}</span>}
              </div>
              <p className="mt-3 text-sm text-text-secondary">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                  plan.highlighted
                      ? 'bg-gradient-to-br from-accent-500 to-accent-400 text-btn-primary-text hover:from-accent-400 hover:to-accent-500'
                    : 'border border-border bg-surface text-text-secondary hover:text-accent'
                }`}
              >
                {plan.name === 'Custom' ? 'Contact Sales' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </button>
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-text-primary text-center">Why Choose Enterprise?</h2>
          <p className="mt-2 text-center text-text-secondary">Everything you need to run procurement at scale.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, idx) => {
              const accent = enterpriseAccents[idx % 3];
              return (
              <div key={benefit.title}
                className="group relative overflow-hidden rounded-[22px] p-6 border border-border bg-surface transition-all duration-300">
                <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(500px circle at 30% 50%, ${accent}15, transparent 50%)` }} />
                <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}CC, ${accent}66)` }} />
                </div>
                <div className="relative z-10 pl-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${accent}15`, color: accent }}>
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-text-primary">{benefit.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{benefit.description}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="group relative mt-16 overflow-hidden rounded-[22px] p-8 text-center border border-border bg-surface transition-all duration-300">
          <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{ background: 'radial-gradient(500px circle at 50% 50%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 50%)' }} />
          <div className="relative z-10">
          <h2 className="text-xl font-bold text-text-primary">Ready to Transform Your Procurement?</h2>
          <p className="mt-2 text-sm text-text-secondary">Talk to our sales team for a custom demo and pricing.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent-500 to-accent-400 px-6 py-3 text-sm font-semibold text-btn-primary-text transition-colors hover:from-accent-400 hover:to-accent-500">
              Schedule a Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:text-accent">
              Contact Sales
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
