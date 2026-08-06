'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  CreditCard,
  Award,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Rocket,
  LifeBuoy,
  ClipboardList,
  AlertTriangle,
  Globe,
  Users,
  PlusCircle,
  Bell,
  Download,
  MessageSquare,
  Handshake,
  FileCheck,
  Truck,
  PackageCheck,
  Sparkles,
  MessageCircle,
  ChevronDown,
  Cpu,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_SELLER_NAV, DASHBOARD_BUYER_NAV, DASHBOARD_ADMIN_NAV } from '@/data/master-data';

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  items?: SidebarItem[];
  sections?: SidebarSection[];
  title?: string;
  className?: string;
}

export function Sidebar({ items, sections, title, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (!sections) return {};
    const state: Record<string, boolean> = {};
    sections.forEach((s) => { state[s.title] = true; });
    return state;
  });

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  const renderItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
              : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary dark:hover:text-dark-text-primary',
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 text-[10px] font-medium text-primary">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r border-border bg-surface transition-all duration-300 dark:bg-dark-surface dark:border-dark-border',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-dark-border">
        {!collapsed && title && (
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary dark:text-dark-text-tertiary">
            {title}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {sections ? (
          <ul className="space-y-3">
            {sections.map((section) => {
              const isExpanded = expandedSections[section.title];
              return (
                <li key={section.title}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary transition-colors hover:text-text-secondary dark:text-dark-text-tertiary"
                  >
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{section.title}</span>
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')}
                        />
                      </>
                    )}
                  </button>
                  {(!collapsed && isExpanded) && (
                    <ul className="mt-1 space-y-0.5">
                      {section.items.map(renderItem)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ) : items ? (
          <ul className="space-y-1">{items.map(renderItem)}</ul>
        ) : null}
      </nav>
    </aside>
  );
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Package, FileText, ShoppingCart, BarChart3, Trophy: Award, Wallet: CreditCard,
  Star: Award, Headphones: LifeBuoy, Settings, Heart: Award, Store: Package, Scale: ClipboardList,
  Users, Grid3X3: ClipboardList, Shield: Award, AlertTriangle, ScrollText: FileText, Activity: Zap, Sparkles,
  Flask: Rocket, PlusCircle: Rocket, Globe, Bell, Download, MessageSquare, Handshake, FileCheck, Truck, PackageCheck,
  DollarSign: CreditCard, TrendingUp: BarChart3, Map: Globe, MessageCircle, Cpu,
};

function mapItem(i: { label: string; href: string; icon: string; badge?: string }): SidebarItem {
  return { label: i.label, href: i.href, icon: ICON_MAP[i.icon] || LayoutDashboard, badge: i.badge ? Number(i.badge) : undefined };
}

export const sellerNavItems: SidebarItem[] = DASHBOARD_SELLER_NAV.map(mapItem);
export const buyerNavItems: SidebarItem[] = DASHBOARD_BUYER_NAV.map(mapItem);
export const adminNavItems: SidebarItem[] = DASHBOARD_ADMIN_NAV.map(mapItem);

export const adminNavSections: SidebarSection[] = [
  {
    title: 'Core',
    items: DASHBOARD_ADMIN_NAV.filter((i) =>
      ['Dashboard', 'Users', 'Products', 'Categories'].includes(i.label),
    ).map(mapItem),
  },
  {
    title: 'Commerce',
    items: DASHBOARD_ADMIN_NAV.filter((i) =>
      ['RFQs', 'Quotes', 'Negotiations', 'Purchase Orders', 'Orders', 'Shipments', 'Deliveries', 'TradeServ'].includes(i.label),
    ).map(mapItem),
  },
  {
    title: 'Finance',
    items: DASHBOARD_ADMIN_NAV.filter((i) =>
      ['Finance'].includes(i.label),
    ).map(mapItem),
  },
  {
    title: 'Compliance',
    items: DASHBOARD_ADMIN_NAV.filter((i) =>
      ['Verification', 'SMS Console', 'Fraud Dashboard', 'Audit Logs'].includes(i.label),
    ).map(mapItem),
  },
  {
    title: 'Intelligence',
    items: DASHBOARD_ADMIN_NAV.filter((i) =>
      ['Geo Intelligence', 'Freight Intelligence', 'Market Intelligence', 'Marketplace Rankings', 'Territory Intelligence', 'Catalog Intelligence', 'AI Orchestrator'].includes(i.label),
    ).map(mapItem),
  },
  {
    title: 'System',
    items: DASHBOARD_ADMIN_NAV.filter((i) =>
      ['System Health', 'Communication', 'Analytics', 'Beta Features', 'Settings'].includes(i.label),
    ).map(mapItem),
  },
];
