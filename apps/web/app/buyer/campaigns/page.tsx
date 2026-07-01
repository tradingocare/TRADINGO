'use client';

import { DashboardPageHeader, StatCard, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useActiveCampaigns, useMyClaims, useClaimReward, useCheckEligibility } from '@/hooks/use-campaign';
import { Megaphone, Gift, Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerCampaignsPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useActiveCampaigns();
  const { data: claims, isLoading: claimsLoading } = useMyClaims();
  const claimMutation = useClaimReward();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (campaignId: string) => {
    setClaimingId(campaignId);
    try {
      const result = await claimMutation.mutateAsync({ campaignId });
      if (result) toast({ title: 'Reward claimed! Check your GOCASH wallet.' });
    } catch {
      toast({ title: 'Failed to claim reward', variant: 'destructive' });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Campaign Center" description="Active promotions and rewards" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Megaphone} label="Active Promotions" value={String(campaigns?.length ?? 0)} />
        <StatCard icon={Gift} label="Available Rewards" value={String(campaigns?.reduce((s, c) => s + (c.maxClaims ? c.maxClaims - c.currentClaims : 99), 0) ?? 0)} />
        <StatCard icon={Award} label="My Claims" value={String(claims?.length ?? 0)} />
        <StatCard icon={Clock} label="Rewards Pending" value={String(claims?.filter((c) => c.status === 'PENDING').length ?? 0)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Active Promotions</CardTitle></CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : !campaigns?.length ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Megaphone className="mb-2 h-8 w-8 text-text-secondary" />
              <p className="text-text-secondary">No active promotions right now. Check back later!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <Card key={c.id} className="border">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="outline">{c.type}</Badge>
                      {c.dailyLimit > 0 && <span className="text-xs text-text-secondary">Daily limit: {c.dailyLimit}</span>}
                    </div>
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.description && <p className="mt-1 text-xs text-text-secondary line-clamp-2">{c.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">{formatINR(Number(c.rewardAmount))}</span>
                      <Button size="sm" onClick={() => handleClaim(c.id)} disabled={claimingId === c.id || claimMutation.isPending}>
                        {claimingId === c.id ? 'Claiming...' : 'Claim Reward'}
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
        <CardHeader><CardTitle>My Claim History</CardTitle></CardHeader>
        <CardContent>
          {claimsLoading ? (
            <p className="text-sm text-text-secondary">Loading claims...</p>
          ) : !claims?.length ? (
            <p className="text-sm text-text-secondary">No claims yet.</p>
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
                      <td className="py-2">{formatINR(Number(claim.amount))}</td>
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
