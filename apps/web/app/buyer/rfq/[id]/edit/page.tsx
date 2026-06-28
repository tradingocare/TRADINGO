'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSmartRfq } from '@/hooks/use-smart-rfq';
import { ArrowLeft, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditRfqPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: rfq, isLoading } = useSmartRfq(id);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (rfq) setForm({
      title: rfq.title || '',
      description: rfq.description || '',
      expiresAt: rfq.expiresAt?.split('T')[0] || '',
    });
  }, [rfq]);

  const update = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const { updateRfq } = await import('@/lib/api/rfqs');
    await updateRfq(id, form);
    router.push(`/buyer/rfq/${id}`);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit RFQ"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="accent" onClick={handleSave} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />Save
            </Button>
            <Button variant="ghost" onClick={() => router.push(`/buyer/rfq/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-white/[0.04]" />)}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-white/80">Title</Label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Expiry Date</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => update('expiresAt', e.target.value)} className="bg-white/[0.04] border-white/[0.06] text-white" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
