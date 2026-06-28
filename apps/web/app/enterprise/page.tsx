'use client'

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

export default function EnterprisePage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Enterprise Plans"
          description="Powerful procurement solutions for businesses of every scale."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-6 sm:p-8 ${
                plan.highlighted ? 'ring-2 ring-[#FF4D00]/50' : ''
              }`}
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF4D00] px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-sm text-white/50">{plan.period}</span>}
              </div>
              <p className="mt-3 text-sm text-white/60">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D00]" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-[#FF4D00] text-white hover:bg-[#FF4D00]/90'
                    : 'border border-white/[0.09] bg-white/[0.04] text-white backdrop-blur-md hover:border-[#FF4D00]/30 hover:text-[#FF4D00]'
                }`}
              >
                {plan.name === 'Custom' ? 'Contact Sales' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center">Why Choose Enterprise?</h2>
          <p className="mt-2 text-center text-white/50">Everything you need to run procurement at scale.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-3xl p-6"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00]">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{benefit.title}</h3>
                <p className="mt-2 text-sm text-white/50">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-xl font-bold text-white">Ready to Transform Your Procurement?</h2>
          <p className="mt-2 text-sm text-white/50">Talk to our sales team for a custom demo and pricing.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="flex items-center gap-2 rounded-2xl bg-[#FF4D00] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF4D00]/90">
              Schedule a Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
