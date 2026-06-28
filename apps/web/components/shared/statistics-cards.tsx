'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

interface StatisticsCardsProps {
  stats: Stat[];
  className?: string;
}

function Counter({ value, suffix, prefix, decimals = 0 }: Stat) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(value / 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, duration / 60);
    return () => clearInterval(timer);
  }, [started, value]);

  return (
    <span ref={ref} className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
      {prefix}{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

export function StatisticsCards({ stats, className }: StatisticsCardsProps) {
  return (
    <div className={cn('grid gap-8 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.04] p-8 text-center backdrop-blur-xl transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]"
        >
          <Counter {...stat} />
          <p className="mt-2 text-sm font-medium text-white/60">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
