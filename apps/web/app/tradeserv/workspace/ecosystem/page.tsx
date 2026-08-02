'use client';

import { useMyProfile } from '@/hooks/use-tradeserv';
import { DashboardPageHeader } from '@/components/dashboard';
import { EcosystemMembershipCard } from '@/components/tradeserv/ecosystem/ecosystem-membership-card';
import { EcosystemTradTrustCard } from '@/components/tradeserv/ecosystem/ecosystem-tradtrust-card';
import { EcosystemGocashCard } from '@/components/tradeserv/ecosystem/ecosystem-gocash-card';
import { EcosystemMarketplaceCard } from '@/components/tradeserv/ecosystem/ecosystem-marketplace-card';
import { EcosystemNearFarBestCard } from '@/components/tradeserv/ecosystem/ecosystem-near-far-best-card';
import { EcosystemNotificationsCard } from '@/components/tradeserv/ecosystem/ecosystem-notifications-card';
import { EcosystemAnalyticsCard } from '@/components/tradeserv/ecosystem/ecosystem-analytics-card';
import { EcosystemAdvertisingCard } from '@/components/tradeserv/ecosystem/ecosystem-advertising-card';
import { EcosystemTradeTalkCard } from '@/components/tradeserv/ecosystem/ecosystem-tradetalk-card';

export default function EcosystemPage() {
  const { data: profile } = useMyProfile();
  const companyId = profile?.companyId ?? '';

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Ecosystem Hub"
        description="Your TradeServ ecosystem — membership, trust, rewards, marketplace insights, and growth"
      />

      {/* Row 1: Membership + TradTrust + GOCASH */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EcosystemMembershipCard />
        <EcosystemTradTrustCard companyId={companyId} />
        <EcosystemGocashCard />
      </div>

      {/* Row 2: Marketplace + Near→Far→Best + Notifications */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EcosystemMarketplaceCard companyId={companyId} />
        <EcosystemNearFarBestCard />
        <EcosystemNotificationsCard />
      </div>

      {/* Row 3: Analytics + Advertising + TradeTalk */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EcosystemAnalyticsCard />
        <EcosystemAdvertisingCard />
        <EcosystemTradeTalkCard />
      </div>

      {/* Bottom note */}
      <div className="rounded-xl border border-border bg-surface/50 px-6 py-4">
        <p className="text-xs text-text-tertiary leading-relaxed">
          The Ecosystem Hub connects every platform capability to your TradeServ presence. Your membership level,
          TradTrust score, GOCASH wallet, marketplace intelligence, and advertising campaigns all work together to
          maximize your professional visibility and growth. Use the AI Copilot (toggle in the sidebar) for personalized
          ecosystem recommendations.
        </p>
      </div>
    </div>
  );
}
