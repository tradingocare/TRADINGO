'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  { emoji: '\uD83D\uDEE1\uFE0F', title: 'Trust & Transparency', desc: 'Every transaction is secured with our escrow system. Verified sellers, authentic products, and complete transparency.', color: '#60A5FA' },
  { emoji: '\uD83E\uDD16', title: 'AI-Powered Matching', desc: 'Our smart algorithms connect you with the right trading partners based on product, price, location, and reputation.', color: '#A78BFA' },
  { emoji: '\uD83C\uDFC6', title: 'Rewards Ecosystem', desc: 'Earn GOCASH on every trade. Participate in TRADGO races. Unlock badges, discounts, and exclusive platform benefits.', color: '#FBBF24' },
  { emoji: '\uD83E\uDD1D', title: 'Community-Driven', desc: 'Join India\'s fastest-growing trading community. Network, learn, and grow with fellow traders and businesses.', color: '#34D399' },
];

export default function AboutTradingo() {
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
          className="mx-auto max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-[32px] border border-[rgba(212,175,55,0.1)] bg-[rgba(255,255,255,0.015)] p-8 sm:p-12"
            style={{
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(212,175,55,0.04), 0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.04)] blur-[60px]" />
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.03)] blur-[60px]" />
            </div>

            <div className="relative z-10 text-center">
              <img src="/logo/trdn.png" alt="TRDN" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />

              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                ✨ What is TRADINGO?
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                What is TRADINGO?
              </h2>

              <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-white/50">
                TRADINGO is India&apos;s first Global Smart Trade System{' '}
                <span className="font-medium text-white/70">powered by TRADHEXA</span> &mdash; a
                comprehensive B2B trading platform that connects manufacturers, suppliers,
                distributors, and buyers across India and beyond.
              </p>

              <Link href="/about-tradingo">
                <motion.span whileHover={{ y: -1 }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.12)] bg-[rgba(212,175,55,0.04)] px-4 py-1.5 text-[11px] font-medium text-[#D4AF37]/70 transition-all hover:bg-[rgba(212,175,55,0.08)]">
                  Learn More About TRADINGO &rarr;
                </motion.span>
              </Link>
            </div>

            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5 text-left transition-all hover:border-[rgba(212,175,55,0.12)]"
                  style={{ backdropFilter: 'blur(12px)' }}
                >
                  <span className="text-2xl sm:text-3xl">{f.emoji}</span>
                  <h3 className="mt-3 text-sm font-bold text-white">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
