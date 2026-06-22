'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Building2, Users, Store, Package, FileText, DollarSign, Shield,
  TrendingUp, Flame, Star, Target, Rocket, X, ChevronRight, ArrowUpRight,
  Factory, LayoutDashboard, Globe, Network, Warehouse, CheckCircle, BarChart3, Map
} from 'lucide-react';
import { dashboardStats, statesData, indiaIntelligence, formatIndian, type StateData } from '@/lib/data/india-hubs';

function useCountUp(target: number, duration = 2500, startOnView = true) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startOnView) {
      hasStarted.current = true;
      let start = 0;
      const step = Math.ceil(target / (duration / 16));
      const t = setInterval(() => {
        start += step;
        if (start >= target) { setValue(target); clearInterval(t); }
        else setValue(start);
      }, 16);
      return () => clearInterval(t);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          let start = 0;
          const step = Math.ceil(target / (duration / 16));
          const t = setInterval(() => {
            start += step;
            if (start >= target) { setValue(target); clearInterval(t); }
            else setValue(start);
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, startOnView]);
  return { value, ref };
}

const statCards = [
  { icon: Globe, label: 'States & UTs', display: '36', value: 36, color: '#D4AF37' },
  { icon: Building2, label: 'Cities Covered', display: '2.9K+', value: 2900, color: '#60A5FA' },
  { icon: Users, label: 'Active Buyers', display: '5.2L+', value: 520000, color: '#34D399' },
  { icon: Store, label: 'Active Sellers', display: '1.3L+', value: 130000, color: '#F472B6' },
  { icon: Package, label: 'Products Listed', display: '1.0Cr+', value: 10000000, color: '#A78BFA' },
  { icon: FileText, label: 'RFQs Posted', display: '3.4L+', value: 340000, color: '#FBBF24' },
  { icon: DollarSign, label: 'Trade Volume', display: '\u20B92840Cr+', value: 28400000000, color: '#34D399' },
  { icon: Shield, label: 'Verified Businesses', display: '98.5K+', value: 98500, color: '#60A5FA' },
];

function StatCard({ icon: Icon, label, display, value, color }: typeof statCards[number]) {
  const { value: count, ref } = useCountUp(value, 2500);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = iconRef.current;
    if (!el) return;
    let start = 0;
    const animate = () => {
      start += 0.3;
      el.style.transform = `translateY(${Math.sin(start) * 2}px)`;
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative h-full w-full overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)] transition-all duration-500 hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.04)]"
      style={{
        backdropFilter: 'blur(28px)',
        boxShadow: '0 15px 50px rgba(0,0,0,0.45)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: '0 25px 60px rgba(212,175,55,0.18)' }} />

      <div className="relative flex h-full flex-col justify-between p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div ref={iconRef} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[rgba(212,175,55,0.05)] sm:h-10 sm:w-10"
            style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
            <Icon size={14} className="sm:hidden" style={{ color }} />
            <Icon size={16} className="hidden sm:block" style={{ color }} />
          </div>
          <span className="mt-0.5 flex items-center gap-1 rounded-full bg-[rgba(34,197,94,0.1)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-emerald-400 sm:px-2 sm:text-[8px]">
            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400 sm:h-1.5 sm:w-1.5" />
            LIVE
          </span>
        </div>
        <div>
          <span ref={ref} className="block text-lg font-black leading-none tracking-tight text-white sm:text-2xl lg:text-[28px] tabular-nums">
            {display}
          </span>
          <span className="mt-0.5 block text-[9px] font-medium text-white/50 sm:text-[10px] lg:text-[11px]">{label}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StateCard({ state }: { state: StateData }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.button
      onClick={() => { const e = new CustomEvent('open-state-modal', { detail: state.id }); window.dispatchEvent(e); }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group relative flex flex-col items-center gap-2 rounded-[20px] border border-[rgba(212,175,55,0.08)] bg-white/[0.02] p-5 transition-all duration-300 hover:border-[rgba(212,175,55,0.25)] hover:bg-[rgba(212,175,55,0.03)] hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[rgba(212,175,55,0.06)] text-lg font-black text-[#D4AF37] transition-transform duration-300 group-hover:scale-110">
        {state.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
      </div>
      <span className="text-center text-xs font-bold text-white/80 group-hover:text-white">{state.name}</span>
      <span className="text-[10px] text-white/35">{state.citiesCovered} Cities</span>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 left-1/2 z-50 w-52 -translate-x-1/2 -translate-y-full rounded-xl border border-[rgba(212,175,55,0.15)] bg-[rgba(11,18,32,0.9)] p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#D4AF37]">{state.name}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <span className="text-white/40">Cities</span><span className="text-right text-white/80">{state.citiesCovered}</span>
                <span className="text-white/40">Products</span><span className="text-right text-white/80">{state.productsListed >= 1000 ? `${(state.productsListed / 1000).toFixed(1)}K` : state.productsListed}</span>
                <span className="text-white/40">Sellers</span><span className="text-right text-white/80">{state.activeSellers >= 1000 ? `${(state.activeSellers / 1000).toFixed(1)}K` : state.activeSellers}</span>
                <span className="text-white/40">Buyers</span><span className="text-right text-white/80">{state.activeBuyers >= 1000 ? `${(state.activeBuyers / 1000).toFixed(1)}K` : state.activeBuyers}</span>
                <span className="text-white/40">RFQs</span><span className="text-right text-white/80">{state.rfqsPosted >= 1000 ? `${(state.rfqsPosted / 1000).toFixed(1)}K` : state.rfqsPosted}</span>
              </div>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-white/30">Top Industries</p>
              <div className="flex flex-wrap gap-1">
                {state.topIndustries.slice(0, 3).map(ind => (
                  <span key={ind} className="rounded-full bg-[rgba(212,175,55,0.1)] px-2 py-0.5 text-[8px] text-[#D4AF37]">{ind}</span>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-[rgba(212,175,55,0.15)] bg-[rgba(11,18,32,0.9)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function StateModal({ state, onClose }: { state: StateData; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', duration: 0.5 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.2)] bg-[rgba(11,18,32,0.85)] p-8 shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.06)] blur-[60px]" />
          <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.04)] blur-[60px]" />
        </div>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-colors hover:bg-white/[0.1] hover:text-white"><X size={14} /></button>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[rgba(212,175,55,0.08)] text-2xl font-black text-[#D4AF37]">
              {state.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{state.name}</h3>
              <p className="text-sm text-[#D4AF37]/70">{state.citiesCovered} Cities Covered</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Products Listed', value: formatIndian(state.productsListed), icon: Package },
              { label: 'Active Sellers', value: formatIndian(state.activeSellers), icon: Store },
              { label: 'Active Buyers', value: formatIndian(state.activeBuyers), icon: Users },
              { label: 'RFQs Posted', value: formatIndian(state.rfqsPosted), icon: FileText },
              { label: 'Orders Completed', value: formatIndian(state.ordersCompleted), icon: TrendingUp },
              { label: 'Trade Volume', value: `\u20B9${(state.tradeVolume / 1e7).toFixed(1)}Cr`, icon: DollarSign },
              { label: 'Verified Companies', value: formatIndian(state.verifiedCompanies), icon: Shield },
              { label: 'Categories', value: formatIndian(state.categories.length * 100), icon: LayoutDashboard },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <s.icon size={14} className="text-[#D4AF37]/60" />
                <div>
                  <p className="text-[10px] text-white/40">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Top Industries</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.topIndustries.map(ind => (
                <span key={ind} className="rounded-full border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.06)] px-3 py-1 text-[10px] font-medium text-[#D4AF37]">{ind}</span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Major Cities</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.majorCities.map(city => ( <span key={city} className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] text-white/60">{city}</span> ))}
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/60">Trending Categories</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.trendingCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,175,55,0.1)] px-3 py-1 text-[10px] font-medium text-[#D4AF37]">
                  <Flame size={10} /> {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
  const [modalState, setModalState] = useState<StateData | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const state = statesData.find(s => s.id === e.detail);
      if (state) setModalState(state);
    };
    window.addEventListener('open-state-modal' as any, handler);
    return () => window.removeEventListener('open-state-modal' as any, handler);
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

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" style={{ gap: '12px' }}>
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <StatCard {...card} />
            </motion.div>
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white sm:text-xl">All States & Union Territories</h3>
              <p className="text-xs text-white/40">Click a state for detailed insights</p>
            </div>
            <span className="rounded-full bg-[rgba(212,175,55,0.1)] px-3 py-1 text-[10px] font-semibold text-[#D4AF37]">
              {statesData.length} Regions
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9">
            {statesData.map(state => (
              <StateCard key={state.id} state={state} />
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
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              <Target className="h-3 w-3" />
              TRADINGO India Intelligence
            </span>
            <h3 className="mt-4 text-2xl font-black text-white sm:text-3xl">TRADINGO India Intelligence</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Factory, title: 'Manufacturing Hotspots', data: indiaIntelligence.manufacturingHotspots.map(h => ({ left: h.name, right: h.value, sub: h.trend })) },
              { icon: TrendingUp, title: 'Fastest Growing States', data: indiaIntelligence.fastestGrowingStates.map(s => ({ left: `${s.rank}. ${s.name}`, right: s.growth })) },
              { icon: Flame, title: 'Trending Industries', data: indiaIntelligence.trendingIndustries.map(ind => ({ left: ind.name, right: ind.momentum })) },
              { icon: Star, title: 'Top Categories', data: indiaIntelligence.topCategories.map(c => ({ left: c.name, right: `${(c.count / 1000).toFixed(1)}K` })) },
              { icon: Users, title: 'Most Active Regions', data: indiaIntelligence.mostActiveRegions.map(r => ({ left: r.name, right: r.activity })) },
              { icon: Rocket, title: 'Emerging Opportunities', data: indiaIntelligence.emergingOpportunities.map(o => ({ left: o.name, right: o.potential })) },
            ].map((section, idx) => (
              <motion.div key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <section.icon size={16} className="text-[#D4AF37]" />
                  <h4 className="text-sm font-bold text-white">{section.title}</h4>
                </div>
                <div className="mt-4 space-y-3">
                  {section.data.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">{d.left}</span>
                      <span className="text-[10px] text-white/40">{d.right}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalState && <StateModal state={modalState} onClose={() => setModalState(null)} />}
      </AnimatePresence>
    </section>
  );
}
