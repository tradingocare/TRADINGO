'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, Briefcase, FileText, Image, Award, Shield, BarChart3, Settings, Inbox, MessageSquare, Globe, Calendar,
  type LucideIcon,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard';
import type { SidebarItem } from '@/components/dashboard/sidebar';
import { AiTradeservCopilot } from '@/components/tradeserv/ai-tradeserv-copilot';

const WORKSPACE_NAV: SidebarItem[] = [
  { label: 'Dashboard', href: '/tradeserv/workspace/dashboard', icon: LayoutDashboard as LucideIcon },
  { label: 'My Inquiries', href: '/tradeserv/workspace/inquiries', icon: Inbox as LucideIcon },
  { label: 'My Profile', href: '/tradeserv/workspace/profile', icon: User as LucideIcon },
  { label: 'My Services', href: '/tradeserv/workspace/services', icon: Briefcase as LucideIcon },
  { label: 'Proposals', href: '/tradeserv/workspace/proposals', icon: FileText as LucideIcon },
  { label: 'Bookings', href: '/tradeserv/workspace/bookings', icon: Calendar as LucideIcon },
  { label: 'Portfolio', href: '/tradeserv/workspace/portfolio', icon: Image as LucideIcon },
  { label: 'Certifications', href: '/tradeserv/workspace/certifications', icon: Award as LucideIcon },
  { label: 'Reviews', href: '/tradeserv/workspace/reviews', icon: MessageSquare as LucideIcon },
  { label: 'Ecosystem', href: '/tradeserv/workspace/ecosystem', icon: Globe as LucideIcon },
  { label: 'Membership', href: '/tradeserv/workspace/membership', icon: Award as LucideIcon },
  { label: 'Verification', href: '/tradeserv/workspace/verification', icon: Shield as LucideIcon },
  { label: 'TradTrust', href: '/tradeserv/workspace/tradtrust', icon: Award as LucideIcon },
  { label: 'Analytics', href: '/tradeserv/workspace/analytics', icon: BarChart3 as LucideIcon },
  { label: 'Settings', href: '/tradeserv/workspace/settings', icon: Settings as LucideIcon },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspaceRoot = pathname === '/tradeserv/workspace' || pathname === '/tradeserv/workspace/';

  return (
    <div className="min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.08), transparent)' }}
      />
      <div className="relative z-10 flex">
        <Sidebar items={WORKSPACE_NAV} title="Workspace" className="hidden lg:flex" />
        <div className="min-h-screen flex-1 lg:pl-64 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-6 py-8">
            {children}
          </div>
        </div>
      </div>
      <AiTradeservCopilot />
    </div>
  );
}
