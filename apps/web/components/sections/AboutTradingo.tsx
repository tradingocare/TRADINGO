'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const features = [
  { emoji: '\uD83D\uDEE1\uFE0F', title: 'Trust & Transparency', desc: 'Every transaction is secured with our escrow system. Verified sellers, authentic products, and complete transparency.', color: '#60A5FA' },
  { emoji: '\uD83E\uDD16', title: 'AI-Powered Matching', desc: 'Our smart algorithms connect you with the right trading partners based on product, price, location, and reputation.', color: '#A78BFA' },
  { emoji: '\uD83C\uDFC6', title: 'Rewards Ecosystem', desc: 'Earn GOCASH on every trade. Participate in TRADGO races. Unlock badges, discounts, and exclusive platform benefits.', color: '#FBBF24' },
  { emoji: '\uD83E\uDD1D', title: 'Community-Driven', desc: 'Join India\'s fastest-growing trading community. Network, learn, and grow with fellow traders and businesses.', color: '#34D399' },
];

export default function AboutTradingo() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 top-0 h-[600px] w-[600px] rounded-full bg-[rgba(96,165,250,0.04)] blur-[160px]" />
        <div className="absolute -right-60 bottom-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[rgba(163,139,250,0.02)] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.012]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1600px]"
        >
          <div className="relative rounded-[24px] border border-border bg-bg-elevated backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 rounded-[24px] overflow-hidden">
              <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-[rgba(96,165,250,0.05)] blur-[80px]" />
              <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-[rgba(255,77,0,0.04)] blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
              <img src="/logo/trdn6.png" alt="TRADINGO" loading="lazy"
                className="mx-auto h-10 w-auto opacity-40 sm:h-12" />
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-500">
                ✨ What is TRADINGO?
              </span>

              <h2 className="mt-5 text-center text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                <span className="text-text-primary">What is</span>{' '}
                <span style={{ background: 'linear-gradient(135deg, var(--accent), #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  TRADINGO?
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-text-secondary">
                TRADINGO is India&apos;s first Global Smart Trade System powered by TRADHEXA&trade;.
                It is an AI-powered trade ecosystem that connects manufacturers, suppliers,
                distributors, exporters, importers, service providers, and buyers through one
                unified platform. By combining intelligent business discovery, verified business
                networks, RFQs, enterprise services, and real-time market intelligence, TRADINGO
                enables businesses to connect, collaborate, and grow with confidence across India
                and global markets.
              </p>

              <Link href="/about-tradingo">
                <motion.span whileHover={{ y: -1 }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 px-4 py-1.5 text-[11px] font-medium text-accent-light transition-all hover:bg-accent/10">
                  Learn More About TRADINGO &rarr;
                </motion.span>
              </Link>
            </div>

            <div className="relative z-10 grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4 px-8 pb-12 sm:px-12 sm:pb-16 lg:px-16 lg:pb-20">
              {features.map((f, idx) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="group relative overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300 h-full">
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(500px circle at 30% 50%, ${f.color}15, transparent 50%)` }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1px ${f.color}30, 0 0 16px ${f.color}10` }} />
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
                    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${f.color}, ${f.color}CC, ${f.color}66)` }} />
                    <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `0 0 12px ${f.color}` }} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full px-5 md:px-6 py-5 md:py-6 pl-7 md:pl-8">
                    <span className="text-2xl md:text-3xl">{f.emoji}</span>
                    <h3 className="mt-3 text-sm md:text-[15px] font-bold text-text-primary">{f.title}</h3>
                    <p className="mt-2 text-[11px] md:text-xs leading-relaxed text-text-secondary flex-1">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
