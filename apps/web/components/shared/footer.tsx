/* ═══════════════════════════════════════════════════════════════
   RECOVERY: components/shared/footer.tsx
   Source: Reconstruction from design system prompt + session memory
   Confidence: MEDIUM
   Assumptions:
     - Uses .glass-card and .glow-surface CSS classes from globals.css
     - 6 separate glass cards in responsive grid (5 top row + 1 newsletter full-width)
     - Newsletter includes email form with subscribe button
     - Uses useCursorGlow hook for cursor-following glow effects
     - Based on the 12-step design system prompt specifications
   ═══════════════════════════════════════════════════════════════ */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { useCursorGlow } from '@/hooks/use-cursor-glow';
import { subscribe } from '@/lib/api/notifications';
import {
  FOOTER_MARKETPLACE_LINKS, FOOTER_COMPANY_LINKS,
  FOOTER_SELLER_LINKS, FOOTER_BUYER_LINKS,
} from '@/data/master-data';

const SOCIAL_ICONS = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/tradingo',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    viewBox: '0 0 24 24',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/tradingo',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    viewBox: '0 0 24 24',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/tradingo',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    viewBox: '0 0 24 24',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@TradingoIndia',
    path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    viewBox: '0 0 24 24',
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState('');

  const brandRef = useCursorGlow<HTMLDivElement>(0);
  const sellersRef = useCursorGlow<HTMLDivElement>(1);
  const buyersRef = useCursorGlow<HTMLDivElement>(2);
  const temRef = useCursorGlow<HTMLDivElement>(3);
  const companyRef = useCursorGlow<HTMLDivElement>(4);
  const newsletterRef = useCursorGlow<HTMLDivElement>(5);

  const cardAccents = ['#3D8BFF', '#F97316', '#22C55E', '#D4AF37', '#8B5CF6'];

  return (
    <footer className="relative overflow-hidden border-t border-border" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-[rgba(59,130,246,0.025)] blur-[100px]" />
        <div className="absolute -right-40 bottom-1/4 h-[350px] w-[350px] rounded-full bg-[rgba(34,197,94,0.015)] blur-[90px]" />
      </div>
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-12 py-10">

        {/* 5-card top row */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

          {/* ─── Card 1: Brand Intro ─── */}
          <div ref={brandRef}
            className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(500px circle at 30% 50%, ${cardAccents[0]}18, transparent 50%)` }} />
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1px ${cardAccents[0]}35, 0 0 20px ${cardAccents[0]}10` }} />
            <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${cardAccents[0]}, ${cardAccents[0]}CC, ${cardAccents[0]}66)` }} />
              <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 12px ${cardAccents[0]}` }} />
            </div>
            <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">
              <Link href="/" className="mb-3 flex items-center justify-center">
                <TradingoLogo height={32} showText={false} />
              </Link>
              <p className="text-sm leading-relaxed text-text-secondary">
                A Global AI-Powered Smart Trade System built on the TRADHEXA platform,
                enabling intelligent commerce, trusted business networking, enterprise services, and
                cross-border trade through one unified ecosystem.
              </p>
              <div className="mt-5 flex gap-3">
                {SOCIAL_ICONS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/15 hover:text-accent">
                    <svg viewBox={s.viewBox} className="h-4 w-4 fill-current" aria-label={s.label}>
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Card 2: For Sellers ─── */}
          <div ref={sellersRef}
            className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(500px circle at 30% 50%, ${cardAccents[1]}18, transparent 50%)` }} />
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1px ${cardAccents[1]}35, 0 0 20px ${cardAccents[1]}10` }} />
            <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${cardAccents[1]}, ${cardAccents[1]}CC, ${cardAccents[1]}66)` }} />
              <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 12px ${cardAccents[1]}` }} />
            </div>
            <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">
                For Sellers
              </h3>
              <ul className="space-y-3">
                {FOOTER_SELLER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="group/link inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent">
                      <span className="h-1 w-1 rounded-full bg-border transition-colors" />
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─── Card 3: For Buyers ─── */}
          <div ref={buyersRef}
            className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(500px circle at 30% 50%, ${cardAccents[2]}18, transparent 50%)` }} />
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1px ${cardAccents[2]}35, 0 0 20px ${cardAccents[2]}10` }} />
            <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${cardAccents[2]}, ${cardAccents[2]}CC, ${cardAccents[2]}66)` }} />
              <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 12px ${cardAccents[2]}` }} />
            </div>
            <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">
                For Buyers
              </h3>
              <ul className="space-y-3">
                {FOOTER_BUYER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="group/link inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent">
                      <span className="h-1 w-1 rounded-full bg-border transition-colors" />
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─── Card 4: TEM Market ─── */}
          <div ref={temRef}
            className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(500px circle at 30% 50%, ${cardAccents[3]}18, transparent 50%)` }} />
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1px ${cardAccents[3]}35, 0 0 20px ${cardAccents[3]}10` }} />
            <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${cardAccents[3]}, ${cardAccents[3]}CC, ${cardAccents[3]}66)` }} />
              <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 12px ${cardAccents[3]}` }} />
            </div>
            <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">
                TEM Market
              </h3>
              <ul className="space-y-3">
                {FOOTER_MARKETPLACE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="group/link inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent">
                      <span className="h-1 w-1 rounded-full bg-border transition-colors" />
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─── Card 5: Company ─── */}
          <div ref={companyRef}
            className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(500px circle at 30% 50%, ${cardAccents[4]}18, transparent 50%)` }} />
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1px ${cardAccents[4]}35, 0 0 20px ${cardAccents[4]}10` }} />
            <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${cardAccents[4]}, ${cardAccents[4]}CC, ${cardAccents[4]}66)` }} />
              <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 12px ${cardAccents[4]}` }} />
            </div>
            <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">
                Company
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="group/link inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent">
                      <span className="h-1 w-1 rounded-full bg-border transition-colors" />
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Separator line */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-50" />
          <span className="absolute flex h-3 w-3 items-center justify-center rounded-full bg-bg-base">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        </div>

        {/* ─── Card 6: Newsletter (full width) ─── */}
        <div>
          <div ref={newsletterRef}
            className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(600px circle at 30% 50%, ${cardAccents[0]}18, transparent 50%)` }} />
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1px ${cardAccents[0]}35, 0 0 20px ${cardAccents[0]}10` }} />
            <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${cardAccents[0]}, ${cardAccents[0]}CC, ${cardAccents[0]}66)` }} />
              <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ boxShadow: `0 0 12px ${cardAccents[0]}` }} />
            </div>
            <div className="relative z-10 p-5 sm:p-6 pl-6 sm:pl-7">
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4 text-center lg:text-left">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${cardAccents[0]}15`, border: `1px solid ${cardAccents[0]}30` }}>
                    <Send className="h-4 w-4" style={{ color: cardAccents[0] }} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-text-primary sm:text-base">
                      Subscribe to Newsletter
                    </h3>
                    <p className="mt-0.5 whitespace-nowrap text-xs leading-relaxed text-text-tertiary">
                      Get the latest product updates, marketplace insights, and exclusive Tradingo news.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col items-center gap-2 lg:w-auto lg:flex-row lg:gap-3">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!email || subscribing) return;
                    setSubscribing(true);
                    setSubError('');
                    try {
                      await subscribe({ email, name: undefined });
                      setSubscribed(true);
                      setEmail('');
                    } catch {
                      setSubError('Subscription failed. Please try again.');
                    } finally {
                      setSubscribing(false);
                    }
                  }} className="flex w-full gap-2 sm:w-auto sm:flex-row">
                    <div className="relative min-w-[200px]">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        disabled={subscribing || subscribed}
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary backdrop-blur transition-all duration-300 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    {subscribed ? (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 whitespace-nowrap">
                        <CheckCircle2 className="h-4 w-4" />
                        Subscribed
                      </span>
                    ) : (
                      <button
                        type="submit"
                        disabled={subscribing}
                        className={[
                          'group relative overflow-hidden rounded-xl px-5 py-2.5',
                          'text-sm font-semibold text-white shadow-lg whitespace-nowrap',
                          'transition-all duration-300 hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed',
                        ].join(' ')}
                        style={{ background: `linear-gradient(135deg, ${cardAccents[0]}, #8b5cf6)` }}
                      >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent" />
                        <span className="pointer-events-none absolute -inset-full left-0 top-0 block h-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent transition-all duration-700 group-hover:left-full" />
                        <span className="relative z-10 flex items-center gap-2">
                          {subscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><span>Subscribe Now</span><ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>
                          )}
                        </span>
                      </button>
                    )}
                  </form>
                  {subError && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-status-error">
                      <AlertCircle className="h-3 w-3" /> {subError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="group relative mt-8 overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300">
          <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{ background: `radial-gradient(500px circle at 50% 50%, ${cardAccents[0]}10, transparent 50%)` }} />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-3 px-5 py-3 text-sm text-text-tertiary sm:flex-row">
            <p>&copy; {new Date().getFullYear()} TRADINGO. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="transition-colors text-text-tertiary hover:text-accent">Privacy</Link>
              <Link href="/terms" className="transition-colors text-text-tertiary hover:text-accent">Terms</Link>
              <Link href="/refund" className="transition-colors text-text-tertiary hover:text-accent">Refund</Link>
              <Link href="/cookies" className="transition-colors text-text-tertiary hover:text-accent">Cookies</Link>
              <Link href="/contact" className="transition-colors text-text-tertiary hover:text-accent">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
