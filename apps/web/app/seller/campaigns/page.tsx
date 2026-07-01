'use client';

import { DashboardPageHeader, StatCard, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSellerCampaigns, useMyClaims, useClaimReward } from '@/hooks/use-campaign';
import { Button } from '@/components/ui/button';
import { Megaphone, Gift, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function SellerCampaignsPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useSellerCampaigns();
  const { data: claims, isLoading: claimsLoading } = useMyClaims();
  const claimMutation = useClaimReward();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (campaignId: string) => {
    setClaimingId(campaignId);
    try {
      const result = await claimMutation.mutateAsync({ campaignId });
      if (result) toast({ title: 'Reward claimed!' });
    } catch {
      toast({ title: 'Failed to claim reward', variant: 'destructive' });
    } finally {
      setClaimingId(null);
    }
  };

  const totalRewards = claims?.filter((c) => c.status === 'PAID').reduce((s, c) => s + Number(c.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Campaigns & Promotions" description="Seller offers and membership rewards" />

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        <StatCard icon={Megaphone} label="Available Campaigns" value={String(campaigns?.length ?? 0)} />
        <StatCard icon={Gift} label="Total Claims" value={String(claims?.length ?? 0)} />
        <StatCard icon={DollarSign} label="Rewards Earned" value={formatINR(totalRewards)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Available Campaigns</CardTitle></CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : !campaigns?.length ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Megaphone className="mb-2 h-8 w-8 text-text-secondary" />
              <p className="text-text-secondary">No campaigns available for sellers at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {campaigns.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="outline">{c.type}</Badge>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{c.status}</span>
                    </div>
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.description && <p className="mt-1 text-xs text-text-secondary line-clamp-2">{c.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">{formatINR(Number(c.rewardAmount))}</span>
                      <Button size="sm" onClick={() => handleClaim(c.id)} disabled={claimingId === c.id}>
                        {claimingId === c.id ? 'Claiming...' : 'Claim'}
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                      <span>{c.currentClaims}/{c.maxClaims || '∞'} claimed</span>
                      <span>Ends {new Date(c.endDate).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Rewards</CardTitle></CardHeader>
        <CardContent>
          {claimsLoading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : !claims?.length ? (
            <p className="text-sm text-text-secondary">No rewards yet. Participate in campaigns to earn rewards.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Campaign</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b last:border-0">
                      <td className="py-2">{claim.campaign?.name ?? claim.campaignId}</td>
                      <td className="py-2 font-medium">{formatINR(Number(claim.amount))}</td>
                      <td className="py-2">
                        {claim.status === 'PAID' ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : claim.status === 'FAILED' ? <XCircle className="inline h-4 w-4 text-red-500" /> : <Clock className="inline h-4 w-4 text-yellow-500" />}
                        <span className="ml-1">{claim.status}</span>
                      </td>
                      <td className="py-2 text-text-secondary">{new Date(claim.claimedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
