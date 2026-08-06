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
  verification: 'Verification',
  disputes: 'Disputes',
  new: 'New',
  edit: 'Edit',
  templates: 'Templates',
  saved: 'Saved',
  notifications: 'Notifications',
  downloads: 'Downloads',
  support: 'Support',
  inbox: 'Inbox',
  negotiations: 'Negotiations',
  po: 'Purchase Orders',
  shipment: 'Shipments',
  delivery: 'Deliveries',
  suppliers: 'Suppliers',
  requirements: 'Requirements',
  compare: 'Compare',
  redeem: 'Redeem',
  categories: 'Categories',
  communication: 'Communication',
  'sms-console': 'SMS Console',
  'sms': 'SMS',
  'audit-logs': 'Audit Logs',
  'system-health': 'System Health',
  'geo-intelligence': 'Geo Intelligence',
  'freight-intelligence': 'Freight Intelligence',
  'market-intelligence': 'Market Intelligence',
  'marketplace-rankings': 'Marketplace Rankings',
  'territory-intelligence': 'Territory Intelligence',
  'fraud-dashboard': 'Fraud Dashboard',
  'beta': 'Beta Features',
  'ai-workspace': 'AI Workspace',
  'ai-console': 'AI Console',
  'ai-credits': 'AI Credits',
  tradetalk: 'TradeTalk',
  community: 'Community',
  communities: 'Communities',
  invitations: 'Invitations',
  manage: 'Manage',
  'ai-infrastructure': 'AI Infrastructure',
  advertising: 'Advertising',
  wallets: 'Wallets',
  reviews: 'Reviews',
  'user-verification': 'User Verification',
  'near-me': 'Near Me',
  tradeserv: 'TradeServ',
  'founder-ai': 'Founder AI',
  finance: 'Finance',
  reports: 'Reports',
  credit: 'Credit',
  'credit-notes': 'Credit Notes',
  collections: 'Collections',
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      <Link
        href="/"
        className="text-text-tertiary transition-colors hover:text-text-primary"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = i === segments.length - 1;
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-text-primary">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-text-tertiary transition-colors hover:text-text-primary"
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
