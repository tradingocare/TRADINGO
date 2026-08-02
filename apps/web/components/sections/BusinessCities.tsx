'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, TrendingUp, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MASTER_CITIES } from '@/data/master-data';
import { getCityStats, CityStat } from '@/lib/api/homepage';

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

const FALLBACK_CITIES: CityData[] = MASTER_CITIES as CityData[];

const formatNum = (n: number): string => {
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

const CityCardImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#04050a] flex flex-col items-center justify-center p-4">
        <span className="text-3xl opacity-20 filter drop-shadow-[0_0_15px_rgba(0,180,255,0.4)]">🏙️</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-all duration-700 group-hover/card:scale-110"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

export default function BusinessCities() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cityLiveData, setCityLiveData] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    getCityStats()
      .then((stats) => {
        const map = new Map<string, number>();
        for (const s of stats) {
          const key = s.city.toLowerCase();
          if (!map.has(key) || (map.get(key) ?? 0) < s.companyCount) map.set(key, s.companyCount);
        }
        setCityLiveData(map);
      })
      .catch(() => {});
  }, []);

  const cities: CityData[] = FALLBACK_CITIES.map((c) => {
    const live = cityLiveData.get(c.name.toLowerCase());
    if (live) return { ...c, sellers: live };
    return c;
  });

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
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-[rgba(0,255,255,0.03)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(0,255,255,0.02)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-prism p-8 sm:p-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[rgba(0,255,255,0.04)] blur-[60px]" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[rgba(0,255,255,0.03)] blur-[60px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <Link href="/products">
              <img
                src="/logo/trdn.png"
                alt="TRDN"
                className="mx-auto mb-4 h-10 w-auto opacity-50 transition-opacity hover:opacity-70 sm:h-12"
              />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,255,255,0.2)] bg-[rgba(0,255,255,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-500">
              {'\uD83C\uDF10'} BUSINESS CITIES
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-primary sm:text-4xl lg:text-5xl">
              Explore India&apos;s Business Cities
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-secondary">
              Discover India&apos;s major manufacturing, trading and industrial hubs powered by TRADHEXA&trade; Intelligence. Explore live marketplace data across 15+ cities — track active sellers, product listings, service providers, and buyer demand in real-time.
            </p>
            <Link href="/products" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-5 py-2.5 text-[11px] font-semibold text-accent-500 transition-all hover:bg-surface-tertiary hover:shadow-[0_0_15px_rgba(255,77,0,0.15)]">
              Browse All Cities <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="relative mt-10">
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated/80 text-primary/60 backdrop-blur-xl transition-all hover:border-border hover:text-primary sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg-elevated/80 text-primary/60 backdrop-blur-xl transition-all hover:border-border hover:text-primary sm:flex"
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
                href={`/products?city=${city.slug}`}
                className="group/card flex-shrink-0"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card-subtle relative w-[280px] overflow-hidden"
                  style={{ width: '320px' }}
                >
                  <div className="relative h-[180px] w-full overflow-hidden">
                    <CityCardImage src={city.image} alt={city.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,5,10,0.95)] via-[rgba(4,5,10,0.4)] to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-black text-primary">{city.name}</h3>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <MapPin size={10} className="text-accent-500" />
                        <span className="text-[11px] font-medium text-text-secondary">{city.state}</span>
                      </div>
                    </div>
                    <Badge variant="warning" className="absolute right-3 top-3 px-2.5 py-0.5 text-[9px] font-bold backdrop-blur-md">
                      {city.growth}
                    </Badge>
                  </div>

                  <div className="p-4 bg-surface-secondary/80">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-accent-500" />
                      <span className="text-[10px] font-semibold text-text-tertiary">{city.industry}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { icon: '\uD83C\uDFED', label: 'Sellers', value: formatNum(city.sellers) },
                        { icon: '\uD83D\uDCE6', label: 'Products', value: formatNum(city.products) },
                        { icon: '\uD83D\uDD27', label: 'Services', value: formatNum(city.services) },
                        { icon: '\uD83D\uDC65', label: 'Buyers', value: formatNum(city.buyers) },
                      ].map((stat) => (
                        <div key={stat.label}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-2 py-1.5 transition-all hover:bg-surface-tertiary"
                        >
                          <span className="text-[11px] leading-none">{stat.icon}</span>
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold leading-none text-primary tabular-nums">{stat.value}</span>
                            <span className="mt-0.5 block text-[7px] leading-none text-text-secondary">{stat.label}</span>
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
          <button onClick={() => scroll('left')} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-elevated/40 text-primary/80">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll('right')} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-elevated/40 text-primary/80">
            <ChevronRight size={14} />
          </button>
        </div>

        <Link href="/products" className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-accent-500 transition-colors hover:text-[#FF7A33] sm:hidden">
          View All <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
