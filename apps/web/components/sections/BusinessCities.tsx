'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, TrendingUp, MapPin } from 'lucide-react';
import { MASTER_CITIES } from '@/data/master-data';

interface CityData {
  id: string;
  name: string;
  state: string;
  image: string;
  sellers: number;
  products: number;
  services: number;
  buyers: number;
  industry: string;
  growth: string;
  slug: string;
}

const cities: CityData[] = MASTER_CITIES as CityData[]

const formatNum = (n: number): string => {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

export default function BusinessCities() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateScrollMetrics = useCallback(() => {
    if (scrollRef.current) {
      setMaxScroll(scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
      setScrollPos(scrollRef.current.scrollLeft);
    }
  }, []);

  useEffect(() => {
    updateScrollMetrics();
    window.addEventListener('resize', updateScrollMetrics);
    return () => window.removeEventListener('resize', updateScrollMetrics);
  }, [updateScrollMetrics]);

  useEffect(() => {
    if (isHovered || maxScroll === 0) return;
    autoScrollRef.current = setInterval(() => {
      if (scrollRef.current) {
        const next = scrollRef.current.scrollLeft + 1;
        if (next >= maxScroll) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollLeft = next;
        }
        setScrollPos(scrollRef.current.scrollLeft);
      }
    }, 30);
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [isHovered, maxScroll]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amt = scrollRef.current.clientWidth * 0.8;
    const to = dir === 'left' ? scrollPos - amt : scrollPos + amt;
    scrollRef.current.scrollTo({ left: to, behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

          <div className="relative z-10 flex flex-col items-center text-center">
            <Link href="/browse">
              <img
                src="/logo/trdn.png"
                alt="TRDN"
                className="mx-auto mb-4 h-10 w-auto opacity-50 transition-opacity hover:opacity-70 sm:h-12"
              />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              {'\uD83C\uDF10'} BUSINESS CITIES
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Explore India&apos;s Business Cities
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-white/50">
              Discover India&apos;s major manufacturing, trading and industrial hubs powered by TRADHEXA&trade; Intelligence. Explore live marketplace data across 15+ cities — track active sellers, product listings, service providers, and buyer demand in real-time.
            </p>
            <Link href="/browse" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[rgba(212,175,55,0.15)] bg-gradient-to-r from-[rgba(212,175,55,0.08)] to-[rgba(212,175,55,0.03)] px-5 py-2.5 text-[11px] font-semibold text-[#D4AF37]/80 transition-all hover:from-[rgba(212,175,55,0.12)] hover:to-[rgba(212,175,55,0.06)] hover:text-[#D4AF37]">
              Browse All Cities <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-[rgba(11,18,32,0.8)] text-white/60 backdrop-blur-xl transition-all hover:border-white/[0.15] hover:text-white sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-[rgba(11,18,32,0.8)] text-white/60 backdrop-blur-xl transition-all hover:border-white/[0.15] hover:text-white sm:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            onScroll={updateScrollMetrics}
          >
            {[...cities, ...cities].map((city, i) => (
              <Link
                key={`${city.id}-${i}`}
                href={`/browse?city=${city.slug}`}
                className="group/card flex-shrink-0"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative w-[280px] overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] transition-all duration-500 hover:border-[rgba(212,175,55,0.25)] hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] sm:w-[320px]"
                  style={{
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="relative h-[180px] w-full overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover transition-all duration-700 group-hover/card:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,18,32,0.9)] via-[rgba(11,18,32,0.3)] to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-black text-white">{city.name}</h3>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <MapPin size={10} className="text-[#D4AF37]/60" />
                        <span className="text-[11px] font-medium text-white/60">{city.state}</span>
                      </div>
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-[rgba(212,175,55,0.15)] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37] backdrop-blur-md">
                      {city.growth}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-[#D4AF37]/60" />
                      <span className="text-[10px] font-medium text-white/40">{city.industry}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { icon: '\uD83C\uDFED', label: 'Sellers', value: formatNum(city.sellers) },
                        { icon: '\uD83D\uDCE6', label: 'Products', value: formatNum(city.products) },
                        { icon: '\uD83D\uDD27', label: 'Services', value: formatNum(city.services) },
                        { icon: '\uD83D\uDC65', label: 'Buyers', value: formatNum(city.buyers) },
                      ].map((stat) => (
                        <div key={stat.label}
                          className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2 py-1.5"
                        >
                          <span className="text-[11px] leading-none">{stat.icon}</span>
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold leading-none text-white tabular-nums">{stat.value}</span>
                            <span className="mt-0.5 block text-[7px] leading-none text-white/35">{stat.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          <button onClick={() => scroll('left')} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/50">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll('right')} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/50">
            <ChevronRight size={14} />
          </button>
        </div>

        <Link href="/browse" className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#D4AF37]/60 transition-colors hover:text-[#D4AF37] sm:hidden">
          View All <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
