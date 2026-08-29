'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Building2, Users, Store, Package, DollarSign, Shield,
  ArrowUpRight, Factory, Globe, CheckCircle, BarChart3,
  Wrench, Briefcase, MessageSquare, Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statesData, type StateData } from '@/lib/data/india-hubs';
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
          <span className="mt-0.5 block text-[11px] font-medium leading-tight text-text-secondary sm:text-xs">{label}</span>
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

      <div className="relative z-10 flex flex-col h-full px-4 md:px-5 py-3.5 pl-6 md:pl-7">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-text-primary">
            {state.name}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="success" className="gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </Badge>
            <div className="flex items-center gap-1">
              <MapPin size={10} style={{ color: `${accent}99` }} className="flex-shrink-0" />
              <span className="text-[10px] text-text-tertiary whitespace-nowrap">{state.citiesCovered} Cities</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex gap-3 flex-1 min-h-0">
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
            <Link href="/trading" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border hover:opacity-80 transition-opacity">
              <span className="text-xs leading-none">{'\uD83D\uDCE6'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Products</span>
              <ArrowUpRight size={11} className="text-text-tertiary" />
            </Link>
            <Link href="/tradeserv" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border hover:opacity-80 transition-opacity">
              <span className="text-xs leading-none">{'\uD83D\uDD27'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Services</span>
              <ArrowUpRight size={11} className="text-text-tertiary" />
            </Link>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border">
              <span className="text-xs leading-none">{'\uD83C\uDFED'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Sellers</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-surface-secondary border border-border">
              <span className="text-xs leading-none">{'\uD83D\uDC65'}</span>
              <span className="text-[10px] text-text-secondary leading-none">Buyers</span>
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
    <section className="relative overflow-hidden pt-8 pb-16 sm:pb-20">
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
              src="/logo/trdn5.png"
              alt="TRADINGO"
              className="mx-auto h-10 w-auto opacity-50 sm:h-12"
            />

            <div className="relative z-10 mt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                {'\u26A1'} INDIA INTELLIGENCE
              </span>

              <h2 className="mt-5 text-2xl font-black leading-tight tracking-tight text-text-primary sm:text-3xl lg:text-4xl"
                style={{ textShadow: '0 0 40px rgba(212,175,55,0.08)' }}>
                India&apos;s Manufacturing &amp; Industry Hubs
              </h2>

              <p className="mx-auto mt-4 max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">
                Discover India&apos;s fastest-growing industrial states, manufacturing hubs,
                verified businesses, and high-value trade opportunities through real-time market
                intelligence powered by TRADINGO and the TRADHEXA&trade; Smart Trade Engine.
                Connect, discover, and grow with confidence on one unified AI-powered trade ecosystem.
              </p>

              <div className="mt-4 flex items-center justify-center gap-3 text-base">
                <span className="font-bold text-text-secondary">One Nation.</span>
                <span className="h-3 w-px bg-border" />
                <span className="font-bold text-[#D4AF37]">Infinite Opportunities.</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-6 lg:grid-cols-8">
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

        <div className="mt-6 flex items-end justify-between gap-4">
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
            <div className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold text-emerald-400 sm:flex"
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
              <span className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-black tracking-tighter"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37' }}>TR</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/60">
                Real-Time Market Intelligence
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
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10"
        >
          {/* Section Header Banner */}
          <div className="relative mx-auto max-w-[1600px] rounded-[24px] border border-border bg-bg-elevated backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 rounded-[24px] overflow-hidden">
              <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-[rgba(212,175,55,0.05)] blur-[80px]" />
              <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-[rgba(59,130,246,0.04)] blur-[80px]" />
            </div>
            <div className="relative z-10 flex flex-col items-center px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14 text-center">
              <img src="/logo/trdn5.png" alt="TRADINGO" loading="lazy"
                className="mx-auto h-10 w-auto opacity-40 sm:h-12" />
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.08)] px-4 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                <Layers className="h-3.5 w-3.5" />
                TRADINGO Ecosystem
              </span>
              <h3 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                <span className="text-text-primary">Power Your Business with</span>{' '}
                <span style={{ background: 'linear-gradient(135deg, var(--accent), #F59E0B, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  TRADINGO Ecosystem
                </span>
              </h3>
              <p className="mx-auto mt-3 w-full max-w-7xl text-base leading-relaxed text-text-secondary sm:mt-4 sm:text-lg sm:text-justify">
                Connect, Collaborate, Grow and Scale your business with TRADINGO&apos;s integrated professional services and business networking platform.
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-8 grid gap-5 lg:gap-6 lg:grid-cols-2">
            {/* CARD 1 — TRADESERV */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[24px] border border-border bg-bg-elevated p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:border-[rgba(59,130,246,0.35)]"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
            >
              {/* Glow overlay */}
              <div className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ background: 'radial-gradient(600px circle at 30% 20%, rgba(59,130,246,0.12), transparent 60%)' }} />
              <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[24px]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6] via-[#60A5FA] to-[#1D4ED8]" />
              </div>

              <div className="relative z-10 pl-2">
                {/* Header Icon + Title */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(59,130,246,0.2)] to-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.3)] shrink-0">
                    <Briefcase className="h-6 w-6 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
                      TradeServ&trade;
                      <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border-none px-2 py-0.5">
                        Professional Services
                      </Badge>
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-[#60A5FA] mt-0.5">
                      India&apos;s Verified Business Professional Network
                    </p>
                  </div>
                </div>
                {/* Description */}
                <div className="mt-5 space-y-3 text-xs sm:text-sm leading-relaxed text-text-secondary">
                  <p>
                    Connect with verified professionals, consultants, agencies, service providers, legal experts, chartered accountants, logistics partners, technology experts, marketing specialists, finance professionals, and industry consultants.
                  </p>
                  <p>
                    Whether you&apos;re looking to hire experts, expand your business capabilities, or find trusted service partners, TradeServ helps businesses connect with verified professionals across every industry.
                  </p>
                </div>

                {/* Features list */}
                <div className="mt-6 border-t border-border/60 pt-5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Key Features</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'Verified Business Professionals',
                      'AI Smart Matching',
                      'Industry Experts',
                      'Company & Individual Profiles',
                      'Secure Business Connections',
                      'Nationwide Professional Network',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-text-primary">
                        <CheckCircle className="h-4 w-4 text-[#60A5FA] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 mt-8 pl-2 pt-4 border-t border-border/40 flex flex-wrap items-center gap-3">
                <Link
                  href="/tradeserv"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
                >
                  Explore TradeServ &rarr;
                </Link>
                <Link
                  href="/tradeserv/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface hover:border-[#3B82F6]/50 px-5 py-2.5 text-xs sm:text-sm font-semibold text-text-primary transition-all hover:scale-[1.02]"
                >
                  Become a Professional
                </Link>
              </div>
            </motion.div>

            {/* CARD 2 — TRADETALK */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-[24px] border border-border bg-bg-elevated p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:border-[rgba(139,92,246,0.35)]"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
            >
              {/* Glow overlay */}
              <div className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ background: 'radial-gradient(600px circle at 30% 20%, rgba(139,92,246,0.12), transparent 60%)' }} />
              <div className="absolute left-0 top-0 bottom-0 w-[5px] overflow-hidden rounded-l-[24px]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#8B5CF6] via-[#A78BFA] to-[#6D28D9]" />
              </div>

              <div className="relative z-10 pl-2">
                {/* Header Icon + Title */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(139,92,246,0.2)] to-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.3)] shrink-0">
                    <MessageSquare className="h-6 w-6 text-[#A78BFA]" />
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
                      TradeTalk&trade;
                      <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border-none px-2 py-0.5">
                        Business Community
                      </Badge>
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-[#A78BFA] mt-0.5">
                      India&apos;s Premium Business Networking Community
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-5 space-y-3 text-xs sm:text-sm leading-relaxed text-text-secondary">
                  <p>
                    Join India&apos;s fastest-growing business networking platform where entrepreneurs, manufacturers, suppliers, exporters, distributors, startups, investors, and industry leaders collaborate, share opportunities, generate leads, discuss market trends, and build long-term business relationships.
                  </p>
                  <p>
                    TradeTalk is the professional networking community built exclusively for business growth.
                  </p>
                </div>

                {/* Features list */}
                <div className="mt-6 border-t border-border/60 pt-5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Key Features</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'Business Networking',
                      'Industry Discussions',
                      'Verified Members',
                      'Business Opportunities',
                      'Knowledge Sharing',
                      'Premium Business Community',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-text-primary">
                        <CheckCircle className="h-4 w-4 text-[#A78BFA] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 mt-8 pl-2 pt-4 border-t border-border/40 flex flex-wrap items-center gap-3">
                <Link
                  href="/tradetalk"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-purple-500/20 hover:scale-[1.02]"
                >
                  Join TradeTalk &rarr;
                </Link>
                <Link
                  href="/tradetalk/communities"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface hover:border-[#8B5CF6]/50 px-5 py-2.5 text-xs sm:text-sm font-semibold text-text-primary transition-all hover:scale-[1.02]"
                >
                  Explore Community
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
