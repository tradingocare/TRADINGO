import { headers } from 'next/headers';
import { Sidebar, adminNavSections } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { WelcomeTour } from '@/components/dashboard/welcome-tour';
import { DashboardProviders } from '@/components/providers/dashboard-providers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Dedicated admin authentication surface: /admin/login renders bare
  // (no dashboard shell) — a sign-in page must not sit inside the
  // admin topbar/sidebar chrome. The middleware marks the exact
  // route via the x-tradingo-admin-login request header.
  const jar = await headers();
  if (jar.get('x-tradingo-admin-login') === '1') {
    return <>{children}</>;
  }

  return (
    <DashboardProviders>
      <div className="min-h-screen bg-bg-base bg-surface">
        <Topbar />
        <div className="flex">
          <Sidebar sections={adminNavSections} title="Admin Panel" />
          <main className="flex-1 pl-64 pt-6 pb-12">
            <div className="container-main">
              {children}
            </div>
          </main>
        </div>
        <WelcomeTour role="admin" />
      </div>
    </DashboardProviders>
  );
}
