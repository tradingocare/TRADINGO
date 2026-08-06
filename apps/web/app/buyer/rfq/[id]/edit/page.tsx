'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSmartRfq } from '@/hooks/use-smart-rfq';
import { smartRfqApi } from '@/lib/api/smart-rfq';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EditRfqPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { data: rfq, isLoading } = useSmartRfq(id);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rfq) setForm({
      title: rfq.title || '',
      description: rfq.description || '',
      expiresAt: rfq.expiresAt?.split('T')[0] || '',
    });
  }, [rfq]);

  const update = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await smartRfqApi.update(id, form);
      toast({ title: 'RFQ updated successfully' });
      router.push(`/buyer/rfq/${id}`);
    } catch {
      toast({ title: 'Failed to update RFQ', variant: 'destructive' });
    }
    finally { setSaving(false); }
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

      <div className="glass-card p-6  space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-surface" />)}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-text-secondary">Title</Label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} className="bg-surface border-border text-text-primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-text-secondary">Expiry Date</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => update('expiresAt', e.target.value)} className="bg-surface border-border text-text-primary" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
