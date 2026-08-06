'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, HelpCircle } from 'lucide-react';
import { engines } from '@/lib/data/tradhexa-engines';

const allEngines = engines;

export default function EngineDetailPage({ engineId: _engineId }: { engineId: string }) {
  const engine = allEngines.find(e => e.id === _engineId)!;
  const others = allEngines.filter(e => e.id !== engine.id);
  const Icon = engine.icon;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[150px]" />
        <div className="absolute -right-60 bottom-0 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[rgba(212,175,55,0.06)]"
            style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
            <Icon size={28} style={{ color: engine.color }} />
          </div>
          <h1 className="mt-4 text-4xl font-black text-gray-900 sm:text-5xl">{engine.name}</h1>
          <p className="mt-1 text-base font-semibold text-accent-500">{engine.tagline}</p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">{engine.description}</p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="col-span-2 surface-card-lg p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-text-primary">What is {engine.name}?</h2>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary">{engine.purpose}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="col-span-2 surface-card-lg p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-text-primary">Why it Matters</h2>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary">
              In a fragmented B2B landscape, {engine.name} brings clarity, efficiency, and trust.
              It eliminates manual effort, reduces friction, and ensures every interaction on
              TRADINGO delivers maximum value to both buyers and sellers.
            </p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8 surface-card-lg p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-text-primary">Key Features</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {engine.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={12} className="mt-0.5 text-accent-500" />
                <span className="text-xs text-text-secondary">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="surface-card-lg p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-emerald-400">Benefits for Buyers</h2>
            <ul className="mt-4 space-y-3">
              {engine.buyerBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(52,211,153,0.1)] text-[8px] text-emerald-400">✓</span>
                  <span className="text-xs text-text-secondary">{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="surface-card-lg p-6 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-accent-500">Benefits for Sellers</h2>
            <ul className="mt-4 space-y-3">
              {engine.sellerBenefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(0,255,255,0.1)] text-[8px] text-accent-500">✓</span>
                  <span className="text-xs text-text-secondary">{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="mt-8 surface-card-lg p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-text-primary">Real Use Cases</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {engine.useCases.map((uc, i) => (
              <div key={i} className="surface-card p-3">
                <p className="text-xs leading-relaxed text-text-secondary">&ldquo;{uc}&rdquo;</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 surface-card-lg p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-text-primary">Frequently Asked Questions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {engine.faqs.map((faq, i) => (
              <div key={i} className="surface-card p-4">
                <div className="flex items-start gap-2">
                  <HelpCircle size={12} className="mt-0.5 text-accent-500" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{faq.q}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-tertiary">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="mt-12 text-center">
          <Link href="/products">
            <motion.span whileHover={{ y: -2, scale: 1.03 }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-500 px-6 py-3 text-sm font-bold text-primary shadow-lg">
              Explore Marketplace <ArrowRight size={16} />
            </motion.span>
          </Link>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs">
            <Link href="/register" className="text-gray-400 underline underline-offset-2 hover:text-gray-600">Become a Seller</Link>
            <span className="text-primary/10">|</span>
            <Link href="/tradhexa" className="text-accent-500 underline underline-offset-2 hover:text-accent-500">Learn About TRADHEXA</Link>
          </div>
        </motion.div>

        <div className="mt-16">
          <div className="mb-6 text-center">
            <h3 className="text-sm font-bold text-gray-600">Explore Other TRADHEXA Engines</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((other) => {
              const OIcon = other.icon;
              return (
                <Link key={other.id} href={other.href}>
                  <motion.div whileHover={{ y: -4, scale: 1.02 }}
                    className="flex items-center gap-3 surface-card p-3 transition-all hover:border-[rgba(212,175,55,0.15)]">
                    <OIcon size={16} style={{ color: other.color }} />
                    <div>
                      <p className="text-xs font-bold text-text-primary">{other.name}</p>
                      <p className="text-[9px] text-text-tertiary">{other.tagline}</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
