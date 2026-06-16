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
    <span ref={ref} className="text-4xl font-bold tracking-tight sm:text-5xl">
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
          className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-sm dark:bg-dark-surface dark:border-dark-border"
        >
          <Counter {...stat} />
          <p className="mt-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
