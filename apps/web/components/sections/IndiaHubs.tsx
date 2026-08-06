'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Building2, Users, Store, Package, DollarSign, Shield,
  TrendingUp, Flame, Star, Target, Rocket, ArrowUpRight,
  Factory, Globe, CheckCircle, BarChart3,
  Wrench
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statesData, indiaIntelligence, type StateData } from '@/lib/data/india-hubs';
import { getPlatformStats } from '@/lib/api/homepage';
import Link from 'next/link';



const formatCompact = (n: number): string => {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

const ICON_MAP: Record<string, any> = { Globe, Building2, Store, Package, Wrench, Users, DollarSign, Shield };

interface TopStatCardProps { icon: React.ElementType; label: string; display: string; color: string }

function TopStatCard({ icon: Icon, label, display, color }: TopStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[16px] border border-border bg-surface-secondary transition-all duration-500 hover:border-[rgba(212,175,55,0.3)]"
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
          <span className="block text-sm font-black leading-none tracking-tight text-text-primary sm:text-base tabular-nums">
            {display}
          </span>
          <span className="mt-0.5 block text-[8px] font-medium text-text-secondary sm:text-[9px]">{label}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StateCard({ state, accent }: { state: StateData; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-[22px] h-full transition-all duration-300 bg-bg-elevated border border-border">
      <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(600px circle at 30% 50%, ${accent}18, transparent 50%)` }} />
      <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}35, 0 0 20px ${accent}10` }} />

      <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}CC, ${accent}66)` }} />
        <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 0 12px ${accent}` }} />
      </div>

      <div className="relative z-10 flex flex-col h-full px-4 md:px-5 py-4 pl-6 md:pl-7">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-text-primary">
            {state.name}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="success" className="gap-1 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </Badge>
            <div className="flex items-center gap-1">
              <MapPin size={10} style={{ color: `${accent}99` }} className="flex-shrink-0" />
              <span className="text-[10px] text-text-tertiary whitespace-nowrap">{state.citiesCovered} Cities</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-3 flex-1 min-h-0">
          <div className="flex-shrink-0 w-24 md:w-28 overflow-hidden rounded-xl border self-stretch"
            style={{ borderColor: `${accent}33` }}>
            {state.heroImage ? (
              <img src={state.heroImage} alt={state.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold"
                style={{ color: accent, background: `${accent}15` }}>
                {state.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Link href="/products" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border hover:opacity-80 transition-opacity">
              <span className="text-xs leading-none">{'\uD83D\uDCE6'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Products</span>
              <span className="ml-auto text-[11px] font-bold text-text-primary tabular-nums leading-none">{formatCompact(state.productsListed)}</span>
              <ArrowUpRight size={11} className="text-text-tertiary" />
            </Link>
            <Link href="/tradeserv" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border hover:opacity-80 transition-opacity">
              <span className="text-xs leading-none">{'\uD83D\uDD27'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Services</span>
              <span className="ml-auto text-[11px] font-bold text-text-primary tabular-nums leading-none">{formatCompact(state.servicesCount)}</span>
              <ArrowUpRight size={11} className="text-text-tertiary" />
            </Link>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border">
              <span className="text-xs leading-none">{'\uD83C\uDFED'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Sellers</span>
              <span className="ml-auto text-[11px] font-bold text-text-primary tabular-nums leading-none">{formatCompact(state.activeSellers)}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border">
              <span className="text-xs leading-none">{'\uD83D\uDC65'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Buyers</span>
              <span className="ml-auto text-[11px] font-bold text-text-primary tabular-nums leading-none">{formatCompact(state.activeBuyers)}</span>
            </div>
          </div>
        </div>
      </div>
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

const FALLBACK_STAT_CARDS: { icon: string; label: string; display: string; color: string }[] = [
  { icon: 'Globe', label: 'States & UTs', display: '36', color: '#D4AF37' },
  { icon: 'Building2', label: 'Cities Covered', display: '2.9K+', color: '#60A5FA' },
  { icon: 'Store', label: 'Sellers', display: '1.8L+', color: '#F472B6' },
  { icon: 'Package', label: 'Products', display: '1.0Cr+', color: '#A78BFA' },
  { icon: 'Wrench', label: 'Services', display: '38.2L+', color: '#FBBF24' },
  { icon: 'Users', label: 'Buyers', display: '5.2L+', color: '#34D399' },
  { icon: 'DollarSign', label: 'Trade Volume', display: '\u20B92840Cr+', color: '#34D399' },
  { icon: 'Shield', label: 'Verified', display: '98.5K+', color: '#60A5FA' },
];

export default function IndiaHubs() {
  const [lastUpdated, setLastUpdated] = useState('');
  const [platformStats, setPlatformStats] = useState<{ productsListed: number; activeTraders: number; liveRfqs: number; ordersCompleted: number; citiesCovered: number } | null>(null);

  useEffect(() => {
    getPlatformStats().then(setPlatformStats).catch(() => {});
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

  const topStatCards = FALLBACK_STAT_CARDS.map((s) => {
    if (s.label === 'Products Listed' && platformStats?.productsListed != null) return { ...s, display: formatCompact(platformStats.productsListed) };
    if (s.label === 'Cities Covered' && platformStats?.citiesCovered != null) return { ...s, display: `${platformStats.citiesCovered.toLocaleString('en-IN')}+` };
    if (s.label === 'Sellers' && platformStats?.activeTraders != null) return { ...s, display: formatCompact(platformStats.activeTraders) + '+' };
    if (s.label === 'Buyers' && platformStats?.activeTraders != null) return { ...s, display: formatCompact(Math.round(platformStats.activeTraders * 0.7)) + '+' };
    return s;
  }).map(s => ({ ...s, icon: ICON_MAP[s.icon] }));

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

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full text-center"
          style={{ maxWidth: '1600px' }}
        >
          <div className="relative overflow-hidden rounded-[32px] border border-[rgba(212,175,55,0.1)] bg-surface-secondary px-10 sm:px-12 py-4 sm:py-5"
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
              src="/logo/trdn6.png"
              alt="TRDN"
              className="mx-auto h-10 w-auto opacity-50 sm:h-12"
            />

            <div className="relative z-10 mt-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                {'\u26A1'} INDIA INTELLIGENCE
              </span>

              <h2 className="mt-5 whitespace-nowrap text-[32px] font-black leading-[1.1] tracking-tight text-text-primary sm:text-[42px] lg:text-[52px]"
                style={{ textShadow: '0 0 40px rgba(212,175,55,0.08)' }}>
                India&apos;s Manufacturing &amp; Industry Hubs
              </h2>

              <p className="mx-auto mt-4 text-lg leading-relaxed text-text-secondary sm:text-xl"
                style={{ maxWidth: '1000px' }}>
                Discover India&apos;s fastest-growing industrial states, manufacturing hubs,
                verified businesses, and high-value trade opportunities through real-time market
                intelligence powered by TRADINGO and the TRADHEXA&trade; Smart Trade Engine.
                Connect, discover, and grow with confidence on one unified AI-powered trade ecosystem.
              </p>

              <div className="mt-4 flex items-center justify-center gap-3 text-base">
                <span className="font-bold text-text-secondary">One Nation.</span>
                <span className="h-3 w-px bg-border" />
                <span className="font-bold text-[#D4AF37]">Infinite Opportunities.</span>
                <span className="h-3 w-px bg-border" />
                <span className="text-text-tertiary">Powered by TRADHEXA.</span>
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

        <div className="mt-8 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black tracking-tighter"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37' }}>TR</span>
            <div>
              <h3 className="text-lg font-black text-text-primary sm:text-xl">All States & Union Territories</h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                Click any state to explore its marketplace &mdash; sellers, products, services &amp; buyers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-semibold text-emerald-400 sm:flex"
              style={{ background: 'rgba(34,197,94,0.06)' }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {lastUpdated || 'Updating...'}
            </div>
            <Badge variant="default" className="px-3 py-1 text-[10px] font-semibold bg-[rgba(212,175,55,0.1)] text-[#D4AF37]">
              {statesData.length} Regions
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {statesData.map((state, idx) => (
            <StateCard key={state.id} state={state} accent={['#F97316','#3B82F6','#EF4444','#D4AF37','#22C55E','#8B5CF6'][idx % 6]} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="group relative mx-auto mt-10 max-w-5xl overflow-hidden rounded-[22px] border border-border bg-bg-elevated transition-all duration-300"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
            style={{ background: 'radial-gradient(600px circle at 30% 50%, rgba(212,175,55,0.08), transparent 50%)' }} />

          <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #D4AF37, #D4AF37CC, #D4AF3766)' }} />
          </div>

          <div className="relative z-10 px-5 md:px-6 py-5 pl-7 md:pl-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded text-[7px] font-black tracking-tighter"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37' }}>TR</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/60">
                Powered by Real-Time TRADHEXA Intelligence
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {intelligencePills.map((pill, i) => {
                const pillColors = ['#F97316','#3B82F6','#EF4444','#D4AF37','#22C55E','#8B5CF6'];
                const pc = pillColors[i % 6];
                return (
                <motion.span
                  key={pill.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium transition-all sm:text-[11px]"
                  style={{ background: `${pc}12`, border: `1px solid ${pc}25`, color: `${pc}CC` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${pc}20`; e.currentTarget.style.borderColor = `${pc}50`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${pc}12`; e.currentTarget.style.borderColor = `${pc}25`; }}
                >
                  <pill.icon size={12} style={{ color: pc }} />
                  {pill.label}
                </motion.span>
              )})}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-24"
        >
          <div className="relative mx-auto max-w-[1600px] rounded-[24px] border border-border bg-bg-elevated backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 rounded-[24px] overflow-hidden">
              <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-[rgba(212,175,55,0.05)] blur-[80px]" />
              <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-[rgba(255,77,0,0.04)] blur-[80px]" />
            </div>
            <div className="relative z-10 flex flex-col items-center px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
              <img src="/logo/trdn6.png" alt="TRADINGO" loading="lazy"
                className="mx-auto h-10 w-auto opacity-40 sm:h-12" />
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.08)] px-4 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                <Target className="h-3 w-3" />
                TRADINGO India Intelligence
              </span>
              <h3 className="mt-5 text-center text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                <span className="text-text-primary">TRADINGO</span>{' '}
                <span style={{ background: 'linear-gradient(135deg, var(--accent), #F59E0B, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  India Intelligence
                </span>
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-text-secondary">
                Unlock real-time market intelligence across India&apos;s industrial corridors, manufacturing hubs, high-growth industries, and emerging business opportunities&mdash;powered by the AI-driven TRADHEXA&trade; Smart Trade Engine.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:gap-5 md:grid-cols-2">
            {([
              { color: '#F97316', emoji: '\uD83C\uDFED', title: 'Manufacturing Hotspots', data: indiaIntelligence.manufacturingHotspots.map(h => ({ left: h.name, right: h.value })) },
              { color: '#3B82F6', emoji: '\uD83D\uDCC8', title: 'Fastest Growing States', data: indiaIntelligence.fastestGrowingStates.map(s => ({ left: `${s.rank}. ${s.name}`, right: s.growth })) },
              { color: '#EF4444', emoji: '\uD83D\uDD25', title: 'Trending Industries', data: indiaIntelligence.trendingIndustries.map(ind => ({ left: ind.name, right: ind.momentum })) },
              { color: '#D4AF37', emoji: '\u2B50', title: 'Top Categories', data: indiaIntelligence.topCategories.map(c => ({ left: c.name, right: `${(c.count / 1000).toFixed(1)}K` })) },
              { color: '#22C55E', emoji: '\uD83D\uDC65', title: 'Most Active Regions', data: indiaIntelligence.mostActiveRegions.map(r => ({ left: r.name, right: r.activity })) },
              { color: '#8B5CF6', emoji: '\uD83D\uDE80', title: 'Emerging Opportunities', data: indiaIntelligence.emergingOpportunities.map(o => ({ left: o.name, right: o.potential })) },
            ]).map((section, idx) => {
              const accent = section.color;
              return (
              <motion.div key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-[22px] transition-all duration-300 h-full bg-bg-elevated border border-border">
                <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(600px circle at 30% 50%, ${accent}18, transparent 50%)` }} />
                <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px ${accent}35, 0 0 20px ${accent}10` }} />
                <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[22px]">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}CC, ${accent}66)` }} />
                  <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `0 0 12px ${accent}` }} />
                </div>
                <div className="relative z-10 px-5 md:px-6 py-5 md:py-6 pl-8 md:pl-9 flex flex-col h-full">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl md:text-2xl">{section.emoji}</span>
                    <h4 className="text-sm md:text-[15px] font-bold text-text-primary">{section.title}</h4>
                  </div>
                  <div className="mt-4 md:mt-5 space-y-2.5 flex-1">
                    {section.data.map((d: any, i: number) => (
                      <div key={i} className="border-b border-border pb-2.5 last:border-0 last:pb-0">
                        <span className="text-xs md:text-sm leading-5 text-text-primary/80 whitespace-nowrap overflow-hidden text-ellipsis block max-w-full">
                          {['\u2B50','\uD83D\uDD25','\uD83D\uDCC8','\uD83C\uDFED','\uD83C\uDF1F','\uD83D\uDE80','\uD83D\uDCA1','\uD83D\uDD0D','\uD83C\uDFC6','\uD83D\uDCBC'][i % 10]}
                          {' '}{d.left}
                          <span className="text-text-tertiary mx-1">&mdash;</span>
                          <span className="font-semibold" style={{ color: accent }}>{d.right}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ); })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
