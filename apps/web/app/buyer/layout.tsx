import { Sidebar, buyerNavItems } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { WelcomeTour } from '@/components/dashboard/welcome-tour';
import { DashboardProviders } from '@/components/providers/dashboard-providers';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <div className="min-h-screen bg-bg-base bg-surface">
        <Topbar />
        <div className="flex">
          <Sidebar items={buyerNavItems} title="Buyer Menu" />
          <main className="flex-1 pl-64 pt-6 pb-12">
            <div className="container-main">
              {children}
            </div>
          </main>
        </div>
        <WelcomeTour role="buyer" />
      </div>
    </DashboardProviders>
  );
}
