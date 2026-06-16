'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createTemplate } from '@/lib/api/category-templates';
import { ArrowLeft } from 'lucide-react';

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name || !categoryId) {
      toast({ title: 'Name and Category ID are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const tpl = await createTemplate({ categoryId, name });
      toast({ title: 'Template created' });
      router.push(`/admin/category-templates/${tpl.id}`);
    } catch {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <DashboardPageHeader
        title="New Template"
        description="Create a new category template"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
        <div>
          <Label>Template Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Food & Beverage Template"
          />
        </div>
        <div>
          <Label>Category ID</Label>
          <Input
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="UUID of the category"
          />
          <p className="mt-1 text-xs text-text-tertiary">You can find the category ID in the categories section.</p>
        </div>
        <Button onClick={handleCreate} disabled={saving} className="w-full">
          {saving ? 'Creating...' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
}
