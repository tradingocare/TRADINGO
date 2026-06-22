'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { engines } from '@/lib/data/tradhexa-engines';

const engineEmojis: Record<string, string> = {
  tradfind: '\uD83D\uDD0D',
  tradmatch: '\uD83C\uDFAF',
  tradrfq: '\uD83D\uDCCB',
  tradconnect: '\uD83D\uDCDE',
  tradtrust: '\uD83D\uDEE1\uFE0F',
  tradzero: '\uD83D\uDCB0',
};

export default function TradhexaEngines() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="relative overflow-hidden rounded-[32px] border border-[rgba(212,175,55,0.1)] bg-[rgba(255,255,255,0.015)] p-8 sm:p-10"
            style={{
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(212,175,55,0.04), 0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.04)] blur-[60px]" />
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.03)] blur-[60px]" />
            </div>

            <img
              src="/logo/trdn.png"
              alt="TRDN"
              className="mx-auto h-10 w-auto opacity-50 sm:h-12"
            />

            <div className="relative z-10 mt-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                {'\u26A1'} TRADHEXA &mdash; 6 Powerful Trading Engines
              </span>
              <h2 className="mt-4 whitespace-nowrap text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                TRADHEXA &mdash; 6 Powerful Trading Engines
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-white/50">
                Six integrated engines powering the TRADINGO ecosystem. From instant discovery to
                zero-risk transactions, everything you need in one platform.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {engines.map((engine, i) => {
            return (
              <motion.div
                key={engine.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col"
              >
                <Link href={engine.href} className="flex flex-1 flex-col">
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="group flex h-full flex-col cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 transition-all duration-500 hover:border-[rgba(212,175,55,0.2)]"
                    style={{
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212,175,55,0.06), transparent 40%)`,
                      }} />

                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)] text-xl"
                          style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                          {engineEmojis[engine.id]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">{engine.name}</h3>
                            <ArrowRight size={12} className="text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#D4AF37]" />
                          </div>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{engine.tagline}</p>
                        </div>
                      </div>

                      <p className="mt-4 flex-1 text-sm leading-relaxed text-white/45">
                        {engine.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {engine.features.slice(0, 3).map((f) => (
                          <span key={f} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[9px] text-white/35">{f}</span>
                        ))}
                        <span className="rounded-full bg-[rgba(212,175,55,0.06)] px-2.5 py-0.5 text-[9px] text-[#D4AF37]/60">{engine.features.length - 3}+</span>
                      </div>

                      <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(212,175,55,0.12)] bg-gradient-to-r from-[rgba(212,175,55,0.06)] to-[rgba(212,175,55,0.02)] px-4 py-2 text-[11px] font-semibold text-[#D4AF37]/80 transition-all group-hover:from-[rgba(212,175,55,0.1)] group-hover:to-[rgba(212,175,55,0.04)] group-hover:text-[#D4AF37]">
                        GoMore <ExternalLink size={11} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
