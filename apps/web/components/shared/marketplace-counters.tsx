'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CounterItem {
  value: number;
  suffix?: string;
  label: string;
  icon?: string;
}

interface MarketplaceCountersProps {
  items: CounterItem[];
  className?: string;
}

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
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
    const increment = Math.max(1, Math.floor(value / 60));
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, duration / 60);
    return () => clearInterval(timer);
  }, [started, value]);

  const format = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return <span ref={ref}>{format(display)}{suffix}</span>;
}

export function MarketplaceCounters({ items, className }: MarketplaceCountersProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-6 md:grid-cols-4', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-xl border border-border bg-surface p-6 text-center shadow-sm dark:bg-dark-surface dark:border-dark-border"
        >
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-400 sm:text-4xl">
            <CountUp value={item.value} suffix={item.suffix} />
          </span>
          <span className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
