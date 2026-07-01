'use client';

import Link from 'next/link';
import { DashboardPageHeader, StatCardSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBuyerWalletSummary } from '@/hooks/use-wallet';
import { Award, AlertCircle, ArrowLeft, Gift, ShoppingCart, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerGocashRedeemPage() {
  const { data: summary, isLoading } = useBuyerWalletSummary();
  const [redeemAmount, setRedeemAmount] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/buyer/gocash">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
        </Link>
        <DashboardPageHeader title="Redeem GOCASH" description="Convert your rewards to real value" />
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : summary ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle><Award className="mr-2 inline h-4 w-4" /> Your Balance</CardTitle></CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-white">{formatINR(summary.available)}</p>
              <p className="mt-1 text-sm text-white/40">Available for redemption</p>
              <p className="mt-4 text-xs text-white/30">Total Balance: {formatINR(summary.balance)} · Locked: {formatINR(summary.locked)}</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle><ShoppingCart className="mr-2 inline h-4 w-4" /> Redeem Now</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-white/60">Amount to Redeem (₹)</Label>
                <Input type="number" min={0} max={summary.available} value={redeemAmount} onChange={(e) => setRedeemAmount(Number(e.target.value))} placeholder="Enter amount" />
              </div>
              {redeemAmount > summary.available && (
                <p className="text-sm text-red-400">Amount exceeds available balance</p>
              )}
              <Button className="w-full" disabled={!redeemAmount || redeemAmount > summary.available} onClick={() => {
                toast({ title: 'Redemption request submitted', description: `Requested to redeem ${formatINR(redeemAmount)}. You will receive confirmation within 24-48 hours.` });
                setRedeemAmount(0);
              }}>
                Redeem GOCASH
              </Button>
              <p className="text-center text-xs text-white/30">Redemption requests are processed within 24-48 hours</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
            <p className="text-white/60">Failed to load wallet data.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/buyer/campaigns" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-orange-500/10 to-transparent p-5 backdrop-blur-xl transition-all hover:border-orange-500/30">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-[#FF4D00]" />
            <div>
              <p className="text-sm font-medium text-white">Earn More GOCASH</p>
              <p className="text-xs text-white/40">Participate in campaigns and earn bonus rewards</p>
            </div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </div>
        </Link>
        <Link href="/buyer/referrals" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-blue-500/10 to-transparent p-5 backdrop-blur-xl transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-white">Refer Friends</p>
              <p className="text-xs text-white/40">Invite your network and earn referral rewards</p>
            </div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </div>
        </Link>
      </div>
    </div>
  );
}
