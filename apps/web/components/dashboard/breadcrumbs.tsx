'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const labelMap: Record<string, string> = {
  seller: 'Seller',
  buyer: 'Buyer',
  admin: 'Admin',
  dashboard: 'Dashboard',
  profile: 'Profile',
  products: 'Products',
  rfqs: 'RFQs',
  quotes: 'Quotes',
  orders: 'Orders',
  payments: 'Payments',
  chat: 'Chat',
  gocash: 'GOCASH',
  tradgo: 'TRADGO',
  analytics: 'Analytics',
  settings: 'Settings',
  users: 'Users',
  companies: 'Tradors',
  kyc: 'KYC Reviews',
  disputes: 'Disputes',
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      <Link
        href="/"
        className="text-white/40 transition-colors hover:text-white/80"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = i === segments.length - 1;
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-white/40" />
            {isLast ? (
              <span className="font-medium text-white/80">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-white/40 transition-colors hover:text-white/80"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
