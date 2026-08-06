'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Layers, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { engines } from '@/lib/data/tradhexa-engines';

const ACCENTS: Record<string, string> = {
  tradfind: '#FF4D00',
  tradmatch: '#3D8BFF',
  tradrfq: '#F59E0B',
  tradconnect: '#4ade80',
  tradtrust: '#06B6D4',
  tradzero: '#8B5CF6',
};

const BADGES: Record<string, string> = {
  tradfind: 'LIVE',
  tradmatch: 'FAST',
  tradrfq: 'SMART',
  tradconnect: 'PRO',
  tradtrust: 'AI',
  tradzero: 'SECURE',
};

export default function TradhexaPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full blur-[150px]"
          style={{ background: 'color-mix(in srgb, var(--accent) 3%, transparent)' }} />
        <div className="absolute -right-60 bottom-0 h-[500px] w-[500px] rounded-full blur-[120px]"
          style={{ background: 'color-mix(in srgb, var(--accent) 2%, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 100%, transparent) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <Zap className="h-3 w-3" />
            TRADHEXA
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            TRADHEXA
          </h1>
          <p className="mt-2 text-lg font-semibold text-accent/60">The 6-Engine Business Framework</p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">
            India&apos;s Smart Trade System powered by six integrated business engines that enable
            discovery, matching, negotiation, communication, trust and zero-risk transactions.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-12 flex flex-col gap-5">
          {engines.map((engine, i) => {
            const Icon = engine.icon;
            const accent = ACCENTS[engine.id];
            const badge = BADGES[engine.id];
            return (
              <Link key={engine.id} href={engine.href}>
                <motion.div whileHover={{ y: -6 }}
                  className="group relative overflow-hidden rounded-[22px] border border-border bg-surface transition-all duration-300">
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(600px circle at 30% 50%, ${accent}18, transparent 50%)` }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1px ${accent}35, 0 0 24px ${accent}15` }} />
                  <div className="relative z-10 flex">
                    <div className="relative w-[5px] flex-shrink-0 overflow-hidden rounded-l-[22px]">
                      <div className="absolute inset-0 transition-all duration-300"
                        style={{ background: `linear-gradient(180deg, ${accent}, ${accent}CC, ${accent}66)` }} />
                      <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                        style={{ boxShadow: `0 0 14px ${accent}, 0 0 28px ${accent}60` }} />
                    </div>
                    <div className="flex flex-1 items-center gap-5 p-6">
                      <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[14px] transition-all duration-300 group-hover:shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}08)`, border: `1px solid ${accent}25` }}>
                        <Icon size={22} style={{ color: engine.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <h3 className="text-base font-black text-text-primary">{engine.name}</h3>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent/60">{engine.tagline}</span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-text-tertiary">{engine.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {engine.features.slice(0, 3).map(f => (
                            <span key={f} className="rounded-full px-2.5 py-0.5 text-[9px] font-medium backdrop-blur-sm transition-all duration-300"
                              style={{ background: `${accent}12`, border: `1px solid ${accent}18`, color: `${accent}BB` }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <span className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 group-hover:shadow-[0_0_12px]"
                          style={{ background: `${accent}20`, border: `1px solid ${accent}30`, color: accent }}>
                          {badge}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 group-hover:gap-2"
                          style={{ color: accent }}>
                          Explore Module <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-16">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              <Layers className="h-3 w-3" />
              What is TRADHEXA?
            </span>
            <h2 className="mt-4 text-2xl font-black text-text-primary sm:text-3xl">What is TRADHEXA?</h2>
          </div>
          <div className="mx-auto max-w-4xl space-y-4 text-center text-sm leading-relaxed text-text-secondary">
            <p>
              TRADHEXA is a six-engine business framework purpose-built for the TRADINGO ecosystem.
              It was created to solve the fundamental challenges of B2B trading — discovery, trust,
              communication, negotiation, and risk — through a single integrated platform.
            </p>
            <p>
              Unlike traditional marketplaces like IndiaMART or TradeIndia that simply list products,
              TRADHEXA actively facilitates every stage of the trading lifecycle. From finding the
              right product (TRADFIND) to completing a secure transaction (TRADZERO), each engine
              handles a critical function. Together, they form a complete Smart Trade System.
            </p>
            <p>
              TRADINGO&apos;s advantage is integration. On other platforms, buyers search, call, negotiate
              via phone, pay via bank transfer, and hope for the best. On TRADINGO, every step is
              powered by an intelligent engine — making trading faster, safer, and more transparent.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-16">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              <Shield className="h-3 w-3" />
              How the Engines Work Together
            </span>
            <h2 className="mt-4 text-2xl font-black text-text-primary sm:text-3xl">How the Engines Work Together</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: '01', title: 'Discover & Match', desc: 'TRADFIND helps buyers discover products. TRADMATCH connects them with the right sellers automatically.', token: 'text-accent' },
              { step: '02', title: 'Negotiate & Communicate', desc: 'TRADRFQ enables competitive quoting and negotiation. TRADCONNECT powers seamless business communication.', token: 'text-status-info' },
              { step: '03', title: 'Trust & Transact', desc: 'TRADTRUST verifies every business. TRADZERO ensures zero-risk transactions with escrow protection.', token: 'text-status-success' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-surface p-6 text-center backdrop-blur-sm">
                <span className={`text-2xl font-black ${item.token}`}>{item.step}</span>
                <h3 className="mt-2 text-sm font-bold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-16">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              <TrendingUp className="h-3 w-3" />
              Why TRADINGO is Different
            </span>
            <h2 className="mt-4 text-2xl font-black text-text-primary sm:text-3xl">Why TRADINGO is Different</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Integrated Ecosystem', value: 'Six engines working together, not six separate tools' },
              { label: 'AI-Powered', value: 'Smart matching, recommendations, and price intelligence' },
              { label: 'Zero-Risk Trading', value: 'Escrow protection on every single transaction' },
              { label: 'Verified Trust', value: '5-layer KYC, GST/PAN verification, Trust Scores' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 backdrop-blur-sm">
                <CheckCircle size={16} className="mt-0.5 text-accent" />
                <div>
                  <p className="text-xs font-bold text-text-primary">{item.label}</p>
                  <p className="text-[11px] text-text-secondary">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-16 text-center">
          <Link href="/products">
            <motion.span whileHover={{ y: -2, scale: 1.03 }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent/80 px-6 py-3 text-sm font-bold text-text-primary shadow-lg">
              Explore Marketplace <ArrowRight size={16} />
            </motion.span>
          </Link>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <Link href="/register" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">Become a Seller</Link>
            <span className="text-text-tertiary">|</span>
            <Link href="/register" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">Start Trading</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
