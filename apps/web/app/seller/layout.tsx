import { Sidebar, sellerNavItems } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary dark:bg-dark-surface">
      <Topbar />
      <div className="flex">
        <Sidebar items={sellerNavItems} title="Seller Menu" />
        <main className="flex-1 pl-64 pt-6 pb-12">
          <div className="container-main">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
