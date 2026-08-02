'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Crown, Calendar, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurrentPlan {
  planId: string;
  planName: string;
  status: string;
  activatedAt: string;
  expiresAt: string;
}

export default function BuyerMembershipPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery<CurrentPlan>({
    queryKey: ['membership', 'current'],
    queryFn: () => apiClient.get('/membership/current').then(r => r.data),
  });

  if (isLoading) return <div className="min-h-screen bg-bg-base flex items-center justify-center"><LoadingSpinner size="xl" /></div>;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-base p-6">
        <PageHeader title="Membership" description="Manage your subscription" />
        <div className="mt-6">
          <EmptyState icon={Crown} title="No active plan" description="Choose a plan to get started" action={<Button onClick={() => router.push('/plans')}>View Plans</Button>} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base p-6 space-y-6">
      <PageHeader title="My Membership" description="Your current subscription" />
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-accent" />
              <div>
                <h2 className="text-xl font-bold text-text-primary">{data.planName}</h2>
                <Badge variant={data.status === 'ACTIVE' ? 'default' : 'secondary'}>{data.status}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Activated: {new Date(data.activatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Expires: {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => router.push('/plans')}>Change Plan</Button>
        </Card>
      </div>
    </div>
  );
}
