'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Building2, Users, Store, Package, DollarSign, Shield,
  TrendingUp, Flame, Star, Target, Rocket, ArrowUpRight,
  Factory, Globe, CheckCircle, BarChart3,
  Wrench
} from 'lucide-react';
import { statesData, indiaIntelligence, type StateData } from '@/lib/data/india-hubs';
import { MASTER_PLATFORM_STATS } from '@/data/master-data';
import Link from 'next/link';



const formatCompact = (n: number): string => {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

const ICON_MAP: Record<string, any> = { Globe, Building2, Store, Package, Wrench, Users, DollarSign, Shield };
const topStatCards = MASTER_PLATFORM_STATS.indiaStats.map(s => ({ ...s, icon: ICON_MAP[s.icon] }));

function TopStatCard({ icon: Icon, label, display, color }: typeof topStatCards[number]) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)] transition-all duration-500 hover:border-[rgba(212,175,55,0.3)]"
      style={{
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div className="relative flex items-center gap-2.5 p-2.5 sm:p-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[rgba(212,175,55,0.05)] sm:h-8 sm:w-8"
          style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
          <Icon size={12} className="sm:hidden" style={{ color }} />
          <Icon size={14} className="hidden sm:block" style={{ color }} />
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-black leading-none tracking-tight text-white sm:text-base tabular-nums">
            {display}
          </span>
          <span className="mt-0.5 block text-[8px] font-medium text-white/50 sm:text-[9px]">{label}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StateCard({ state }: { state: StateData }) {
  return (
    <Link href={`/browse?state=${encodeURIComponent(state.name)}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="group relative cursor-pointer overflow-hidden rounded-[20px] border border-[rgba(255,196,0,0.15)] bg-[rgba(255,255,255,0.015)] transition-all duration-500 hover:border-[rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]"
        style={{
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          minHeight: '200px',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: 'inset 0 0 60px rgba(212,175,55,0.06)' }} />

        <div className="relative z-10 flex h-full flex-col p-4">
          <div className="flex items-center gap-3">
            {state.heroImage ? (
              <div className="h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-full border-2 border-[rgba(212,175,55,0.2)]">
                <img
                  src={state.heroImage}
                  alt={state.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(212,175,55,0.25)] to-[rgba(212,175,55,0.08)] text-base font-black text-[#D4AF37]"
                style={{ border: '2px solid rgba(212,175,55,0.15)' }}>
                {state.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-black text-white group-hover:text-[#D4AF37] transition-colors duration-300">
                {state.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <MapPin size={10} className="text-[#D4AF37]/60 flex-shrink-0" />
                <span className="truncate text-[10px] text-white/40">{state.citiesCovered} Cities</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[
              { icon: '\uD83C\uDFED', label: 'Sellers', value: formatCompact(state.activeSellers) },
              { icon: '\uD83D\uDCE6', label: 'Products', value: formatCompact(state.productsListed) },
              { icon: '\uD83D\uDD27', label: 'Services', value: formatCompact(state.servicesCount) },
              { icon: '\uD83D\uDC65', label: 'Buyers', value: formatCompact(state.activeBuyers) },
            ].map((stat) => (
              <div key={stat.label}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2 py-1.5 transition-colors group-hover:bg-white/[0.04]"
              >
                <span className="text-xs leading-none">{stat.icon}</span>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold leading-none text-white tabular-nums">{stat.value}</span>
                  <span className="block text-[7px] text-white/35 leading-none mt-0.5">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(34,197,94,0.08)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
              LIVE MARKET DATA
            </span>
            <ArrowUpRight size={11} className="text-white/20 transition-all duration-300 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

const intelligencePills = [
  { icon: MapPin, label: '36 States & UTs' },
  { icon: Factory, label: 'Manufacturing Clusters' },
  { icon: Package, label: 'Product Ecosystems' },
  { icon: CheckCircle, label: 'Verified Businesses' },
  { icon: BarChart3, label: 'Live RFQ Intelligence' },
  { icon: Globe, label: 'Export Opportunities' },
];

export default function IndiaHubs() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setLastUpdated(`Updated ${h}:${m} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pb-24 pt-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 top-1/3 h-[600px] w-[600px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[150px]" />
        <div className="absolute -right-60 bottom-1/3 h-[500px] w-[500px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto text-center"
          style={{ maxWidth: '900px' }}
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
                {'\u26A1'} INDIA INTELLIGENCE
              </span>

              <h2 className="mt-5 whitespace-nowrap text-[28px] font-black leading-[1.1] tracking-tight text-white sm:text-[36px] lg:text-[44px]"
                style={{ textShadow: '0 0 40px rgba(212,175,55,0.08)' }}>
                India&apos;s Manufacturing &amp; Industry Hubs
              </h2>

              <p className="mx-auto mt-4 text-base leading-relaxed text-white/50 sm:text-lg"
                style={{ maxWidth: '900px' }}>
                Explore India&apos;s fastest-growing industrial states, manufacturing clusters and
                business opportunities powered by real-time TRADINGO intelligence.
              </p>

              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                <span className="font-bold text-white/60">One Nation.</span>
                <span className="h-3 w-px bg-white/15" />
                <span className="font-bold text-[#D4AF37]">Infinite Opportunities.</span>
                <span className="h-3 w-px bg-white/15" />
                <span className="text-white/35">Powered by TRADHEXA.</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-8" style={{ gap: '8px' }}>
          {topStatCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <TopStatCard {...card} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white sm:text-xl">All States & Union Territories</h3>
            <p className="mt-1 text-xs text-white/40">
              Click any state to explore its marketplace &mdash; sellers, products, services &amp; buyers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full bg-[rgba(34,197,94,0.06)] px-3 py-1 text-[9px] font-semibold text-emerald-400 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {lastUpdated || 'Updating...'}
            </div>
            <span className="rounded-full bg-[rgba(212,175,55,0.1)] px-3 py-1 text-[10px] font-semibold text-[#D4AF37]">
              {statesData.length} Regions
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {statesData.map(state => (
            <StateCard key={state.id} state={state} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[28px] border border-[rgba(212,175,55,0.08)] bg-[rgba(255,255,255,0.01)] py-5 sm:py-6"
          style={{
            backdropFilter: 'blur(28px)',
            boxShadow: '0 15px 50px rgba(0,0,0,0.45)',
          }}
        >
          <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/50">
            Powered by Real-Time TRADHEXA Intelligence
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 px-4 sm:gap-3">
            {intelligencePills.map((pill, i) => (
              <motion.span
                key={pill.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.1)] bg-[rgba(212,175,55,0.04)] px-3 py-1.5 text-[10px] font-medium text-white/60 transition-all hover:border-[rgba(212,175,55,0.2)] hover:text-[#D4AF37] sm:text-[11px]"
              >
                <pill.icon size={12} className="text-[#D4AF37]/60" />
                {pill.label}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="mx-auto max-w-4xl text-center">
            <img
              src="/logo/trdn.png"
              alt="TRADINGO"
              className="mx-auto h-10 w-auto opacity-50 sm:h-12"
            />
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <Target className="h-3 w-3" />
              TRADINGO India Intelligence
            </span>
            <h3 className="mt-4 text-2xl font-black text-white sm:text-3xl">TRADINGO India Intelligence</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              Real-time market intelligence across India&apos;s manufacturing hotspots, trending industries, and emerging business opportunities powered by TRADHEXA&trade;.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Factory, emoji: '\uD83C\uDFED', title: 'Manufacturing Hotspots', data: indiaIntelligence.manufacturingHotspots.map(h => ({ left: h.name, right: h.value, sub: h.trend })) },
              { icon: TrendingUp, emoji: '\uD83D\uDCC8', title: 'Fastest Growing States', data: indiaIntelligence.fastestGrowingStates.map(s => ({ left: `${s.rank}. ${s.name}`, right: s.growth })) },
              { icon: Flame, emoji: '\uD83D\uDD25', title: 'Trending Industries', data: indiaIntelligence.trendingIndustries.map(ind => ({ left: ind.name, right: ind.momentum })) },
              { icon: Star, emoji: '\u2B50', title: 'Top Categories', data: indiaIntelligence.topCategories.map(c => ({ left: c.name, right: `${(c.count / 1000).toFixed(1)}K` })) },
              { icon: Users, emoji: '\uD83D\uDC65', title: 'Most Active Regions', data: indiaIntelligence.mostActiveRegions.map(r => ({ left: r.name, right: r.activity })) },
              { icon: Rocket, emoji: '\uD83D\uDE80', title: 'Emerging Opportunities', data: indiaIntelligence.emergingOpportunities.map(o => ({ left: o.name, right: o.potential })) },
            ].map((section, idx) => (
              <motion.div key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(212,175,55,0.2)]"
                style={{
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
                    style={{
                      background: `linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))`,
                      border: '1px solid rgba(212,175,55,0.1)',
                    }}>
                    {section.emoji}
                  </div>
                  <h4 className="text-sm font-bold text-white">{section.title}</h4>
                </div>
                <div className="mt-4 space-y-2.5">
                  {section.data.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                        {['\u2B50','\uD83D\uDD25','\uD83D\uDCC8','\uD83C\uDFED','\uD83C\uDF1F','\uD83D\uDE80','\uD83D\uDCA1','\uD83D\uDD0D','\uD83C\uDFC6','\uD83D\uDCBC'][i % 10]}
                        {d.left}
                      </span>
                      <span className="text-[10px] font-semibold text-[#D4AF37]/70">{d.right}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
