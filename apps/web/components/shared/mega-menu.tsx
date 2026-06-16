'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  href: string;
  description?: string;
}

interface MegaMenuColumn {
  title: string;
  items: MenuItem[];
}

interface MegaMenuProps {
  label: string;
  columns: MegaMenuColumn[];
  featured?: {
    title: string;
    description: string;
    href: string;
  };
}

export function MegaMenu({ label, columns, featured }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-16 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            onMouseLeave={() => setIsOpen(false)}
            className="absolute left-0 top-full z-50 mt-1 w-screen max-w-4xl rounded-2xl border border-border bg-surface p-6 shadow-xl animate-slide-down dark:bg-dark-surface dark:border-dark-border"
          >
            <div className={cn('grid gap-8', featured ? 'grid-cols-4' : 'grid-cols-3')}>
              {columns.map((column) => (
                <div key={column.title}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary dark:text-dark-text-tertiary">
                    {column.title}
                  </h3>
                  <ul className="space-y-2">
                    {column.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="group block rounded-lg p-2 transition-colors hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
                        >
                          <span className="text-sm font-medium text-text-primary transition-colors group-hover:text-primary-600 dark:text-dark-text-primary dark:group-hover:text-primary-400">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="mt-0.5 block text-xs text-text-tertiary dark:text-dark-text-tertiary">
                              {item.description}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {featured && (
                <div className="col-span-1 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-4 dark:from-primary-900/20 dark:to-accent-900/20">
                  <Link href={featured.href} onClick={() => setIsOpen(false)}>
                    <h4 className="mb-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {featured.title}
                    </h4>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                      {featured.description}
                    </p>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
