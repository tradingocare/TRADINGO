import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — TRADINGO',
  description: 'Your TRADINGO dashboard. Manage your account, orders, products and more.',
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 text-white/60">Welcome to Trading</p>
    </div>
  );
}
