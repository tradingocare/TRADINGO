'use client'

import Link from 'next/link'
import { ArrowRight, BellRing, Briefcase, Gem, Sparkles } from 'lucide-react'

/**
 * Premium future-ready placeholder for Services & Brands.
 * Rendered ONLY until their public data sources exist — no fabricated data.
 */
export function ComingSoonSection({
  icon,
  title,
  subtitle,
  description,
  ctas,
  notifyEmail,
  setNotifyEmail,
  onNotify,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  ctas: { label: string; onClick?: () => void; href?: string; primary?: boolean }[]
  notifyEmail?: string
  setNotifyEmail?: (v: string) => void
  onNotify?: () => void
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% -20%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%)',
        }}
      />
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          {icon}
        </div>
        <h3 className="mt-5 text-2xl font-bold tracking-tight text-text-primary">{title}</h3>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-accent">
          <Sparkles size={11} /> {subtitle}
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm text-text-tertiary">{description}</p>
        {setNotifyEmail && onNotify && (
          <div className="mx-auto mt-6 flex max-w-sm items-center gap-2">
            <input
              type="email"
              value={notifyEmail ?? ''}
              onChange={e => setNotifyEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/50"
            />
            <button
              onClick={onNotify}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }}
            >
              <BellRing size={14} /> Notify Me
            </button>
          </div>
        )}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {ctas.map(cta =>
            cta.href ? (
              <Link
                key={cta.label}
                href={cta.href}
                className={
                  cta.primary
                    ? 'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110'
                    : 'inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent'
                }
                style={cta.primary ? { background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' } : undefined}
              >
                {cta.label} <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                key={cta.label}
                onClick={cta.onClick}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
              >
                {cta.label} <BellRing size={14} />
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

export function ServicesPlaceholder(props: {
  notifyEmail: string
  setNotifyEmail: (v: string) => void
  onNotify: () => void
}) {
  return (
    <ComingSoonSection
      icon={<Briefcase className="h-7 w-7" />}
      title="Services Marketplace"
      subtitle="Launching Soon"
      description="Verified Business Services will appear here — the layout is ready and scales automatically."
      notifyEmail={props.notifyEmail}
      setNotifyEmail={props.setNotifyEmail}
      onNotify={props.onNotify}
      ctas={[
        { label: 'Become a Service Provider', href: '/register', primary: true },
        { label: 'Explore Products', href: '/products' },
      ]}
    />
  )
}

export function BrandsPlaceholder() {
  return (
    <ComingSoonSection
      icon={<Gem className="h-7 w-7" />}
      title="Featured Brands"
      subtitle="Launching Soon"
      description="Verified manufacturers and trusted brands will appear here when the public Brand API ships."
      ctas={[
        { label: 'Register Your Brand', href: '/register', primary: true },
        { label: 'Become a Verified Brand', href: '/register' },
        { label: 'Explore Products', href: '/products' },
      ]}
    />
  )
}
