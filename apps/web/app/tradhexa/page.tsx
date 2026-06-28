'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Layers, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { engines } from '@/lib/data/tradhexa-engines';

export default function TradhexaPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[150px]" />
        <div className="absolute -right-60 bottom-0 h-[500px] w-[500px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            <Zap className="h-3 w-3" />
            TRADHEXA
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            TRADHEXA
          </h1>
          <p className="mt-2 text-lg font-semibold text-[#D4AF37]/60">The 6-Engine Business Framework</p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/50">
            India&apos;s Smart Trade System powered by six integrated business engines that enable
            discovery, matching, negotiation, communication, trust and zero-risk transactions.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {engines.map((engine, _i) => {
            const Icon = engine.icon;
            return (
              <Link key={engine.id} href={engine.href}>
                <motion.div whileHover={{ y: -6, scale: 1.02 }}
                  className="group h-full rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:border-[rgba(212,175,55,0.2)]"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(600px circle, rgba(212,175,55,0.06), transparent 40%)` }} />
                  <div className="relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)]"
                      style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                      <Icon size={20} style={{ color: engine.color }} />
                    </div>
                    <h3 className="mt-4 text-base font-black text-white">{engine.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/50">{engine.tagline}</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">{engine.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {engine.features.slice(0, 3).map(f => (
                        <span key={f} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[8px] text-white/35">{f}</span>
                      ))}
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
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <Layers className="h-3 w-3" />
              What is TRADHEXA?
            </span>
            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">What is TRADHEXA?</h2>
          </div>
          <div className="mx-auto max-w-4xl space-y-4 text-center text-sm leading-relaxed text-white/50">
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
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <Shield className="h-3 w-3" />
              How the Engines Work Together
            </span>
            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">How the Engines Work Together</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: '01', title: 'Discover & Match', desc: 'TRADFIND helps buyers discover products. TRADMATCH connects them with the right sellers automatically.', color: '#D4AF37' },
              { step: '02', title: 'Negotiate & Communicate', desc: 'TRADRFQ enables competitive quoting and negotiation. TRADCONNECT powers seamless business communication.', color: '#60A5FA' },
              { step: '03', title: 'Trust & Transact', desc: 'TRADTRUST verifies every business. TRADZERO ensures zero-risk transactions with escrow protection.', color: '#34D399' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 text-center backdrop-blur-sm">
                <span className="text-2xl font-black" style={{ color: item.color }}>{item.step}</span>
                <h3 className="mt-2 text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/45">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-16">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <TrendingUp className="h-3 w-3" />
              Why TRADINGO is Different
            </span>
            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">Why TRADINGO is Different</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Integrated Ecosystem', value: 'Six engines working together, not six separate tools' },
              { label: 'AI-Powered', value: 'Smart matching, recommendations, and price intelligence' },
              { label: 'Zero-Risk Trading', value: 'Escrow protection on every single transaction' },
              { label: 'Verified Trust', value: '5-layer KYC, GST/PAN verification, Trust Scores' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 backdrop-blur-sm">
                <CheckCircle size={16} className="mt-0.5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[11px] text-white/45">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-16 text-center">
          <Link href="/browse">
            <motion.span whileHover={{ y: -2, scale: 1.03 }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0B1220] shadow-lg">
              Explore Marketplace <ArrowRight size={16} />
            </motion.span>
          </Link>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <Link href="/register" className="text-white/40 underline underline-offset-2 hover:text-white/60">Become a Seller</Link>
            <span className="text-white/10">|</span>
            <Link href="/register" className="text-white/40 underline underline-offset-2 hover:text-white/60">Start Trading</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
