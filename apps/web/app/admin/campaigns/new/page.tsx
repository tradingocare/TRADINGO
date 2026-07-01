'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCampaign } from '@/hooks/use-campaign';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

const CAMPAIGN_TYPES = ['SIGNUP', 'MEMBERSHIP', 'CASHBACK', 'FESTIVAL', 'REFERRAL', 'SELLER', 'BUYER', 'CATEGORY', 'PRODUCT', 'ORDER', 'COUPON', 'LIMITED_TIME', 'AI'] as const;

export default function NewCampaignPage() {
  const router = useRouter();
  const createMutation = useCreateCampaign();
  const [form, setForm] = useState({
    name: '', description: '', type: 'CASHBACK', priority: 0,
    startDate: '', endDate: '', budget: 0, maxClaims: 0, rewardAmount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast({ title: 'Validation Error', description: 'Name, start date, and end date are required', variant: 'destructive' });
      return;
    }
    try {
      const result = await createMutation.mutateAsync(form as any);
      toast({ title: 'Campaign created' });
      router.push(`/admin/campaigns/${result.id}`);
    } catch {
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="New Campaign"
        description="Create a new campaign"
        actions={<Link href="/admin/campaigns"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>}
      />

      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Cashback 2026" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <select id="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Campaign description..." rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input id="budget" type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardAmount">Reward Amount (₹)</Label>
                <Input id="rewardAmount" type="number" min={0} value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxClaims">Max Claims (0=unlimited)</Label>
                <Input id="maxClaims" type="number" min={0} value={form.maxClaims} onChange={(e) => setForm({ ...form, maxClaims: Number(e.target.value) })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/campaigns"><Button variant="outline" type="button">Cancel</Button></Link>
              <Button type="submit" disabled={createMutation.isPending}><Save className="mr-2 h-4 w-4" /> {createMutation.isPending ? 'Creating...' : 'Create Campaign'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
