'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAd } from '@/hooks/use-advertising';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import type { AdType, AdPricingModel, AdTargetType, CreateAdData } from '@/lib/api/advertising';

const AD_TYPES: { value: AdType; label: string }[] = [
  { value: 'SPONSORED_PRODUCT', label: 'Sponsored Product' },
  { value: 'SPONSORED_COMPANY', label: 'Sponsored Company' },
  { value: 'SPONSORED_CATEGORY', label: 'Sponsored Category' },
  { value: 'HOMEPAGE_BANNER', label: 'Homepage Banner' },
  { value: 'CATEGORY_BANNER', label: 'Category Banner' },
  { value: 'SEARCH_KEYWORD_AD', label: 'Search Keyword Ad' },
  { value: 'CITY_PROMOTION', label: 'City Promotion' },
  { value: 'FEATURED_SELLER', label: 'Featured Seller' },
  { value: 'FEATURED_BRAND', label: 'Featured Brand' },
];

const PRICING_MODELS: { value: AdPricingModel; label: string }[] = [
  { value: 'CPC', label: 'Cost Per Click (CPC)' },
  { value: 'CPM', label: 'Cost Per Mille (CPM)' },
  { value: 'FIXED', label: 'Fixed Price' },
];

const TARGET_TYPES: { value: AdTargetType; label: string }[] = [
  { value: 'COUNTRY', label: 'Country' },
  { value: 'STATE', label: 'State' },
  { value: 'CITY', label: 'City' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'KEYWORD', label: 'Keyword' },
  { value: 'INDUSTRY', label: 'Industry' },
];

export default function NewAdvertisingPage() {
  const router = useRouter();
  const createMutation = useCreateAd();
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState<Array<{ targetType: AdTargetType; targetValue: string }>>([]);

  const [form, setForm] = useState({
    type: '' as AdType | '',
    pricingModel: '' as AdPricingModel | '',
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    dailyBudget: '',
    totalBudget: '',
    cpc: '',
    cpm: '',
    fixedPrice: '',
    startDate: '',
    endDate: '',
    productId: '',
    categoryId: '',
    keyword: '',
    city: '',
    brandId: '',
    autoPause: false,
    autoResume: false,
    autoStop: false,
  });
  const [newTargetType, setNewTargetType] = useState<AdTargetType | ''>('');
  const [newTargetValue, setNewTargetValue] = useState('');

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const addTarget = () => {
    if (newTargetType && newTargetValue.trim()) {
      setTargets(t => [...t, { targetType: newTargetType as AdTargetType, targetValue: newTargetValue.trim() }]);
      setNewTargetType('');
      setNewTargetValue('');
    }
  };

  const removeTarget = (idx: number) => setTargets(t => t.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.pricingModel) { toast({ title: 'Please select type and pricing model', variant: 'destructive' }); return; }
    if (!form.startDate || !form.endDate) { toast({ title: 'Start and end dates are required', variant: 'destructive' }); return; }

    const data: CreateAdData = {
      type: form.type as AdType,
      pricingModel: form.pricingModel as AdPricingModel,
      title: form.title || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      targetUrl: form.targetUrl || undefined,
      dailyBudget: Number(form.dailyBudget) || 0,
      totalBudget: Number(form.totalBudget) || 0,
      cpc: form.cpc ? Number(form.cpc) : undefined,
      cpm: form.cpm ? Number(form.cpm) : undefined,
      fixedPrice: form.fixedPrice ? Number(form.fixedPrice) : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      autoPause: form.autoPause,
      autoResume: form.autoResume,
      autoStop: form.autoStop,
      productId: form.productId || undefined,
      categoryId: form.categoryId || undefined,
      keyword: form.keyword || undefined,
      city: form.city || undefined,
      brandId: form.brandId || undefined,
      targets: targets.length > 0 ? targets : undefined,
    };

    setSaving(true);
    try {
      await createMutation.mutateAsync(data);
      toast({ title: 'Campaign created successfully' });
      router.push('/seller/advertising');
    } catch {
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Create Campaign" description="Set up a new advertising campaign" actions={
        <Link href="/seller/advertising"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
      } />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ad Type *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => update('type', e.target.value)}>
                <option value="">Select type</option>
                {AD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pricing Model *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.pricingModel} onChange={e => update('pricingModel', e.target.value)}>
                <option value="">Select pricing</option>
                {PRICING_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Campaign title" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe your campaign" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Target URL</Label>
              <Input value={form.targetUrl} onChange={e => update('targetUrl', e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Budget & Schedule</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Daily Budget (₹)</Label>
              <Input type="number" min="0" value={form.dailyBudget} onChange={e => update('dailyBudget', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total Budget (₹)</Label>
              <Input type="number" min="0" value={form.totalBudget} onChange={e => update('totalBudget', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CPC (₹)</Label>
              <Input type="number" min="0" step="0.01" value={form.cpc} onChange={e => update('cpc', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CPM (₹)</Label>
              <Input type="number" min="0" step="0.01" value={form.cpm} onChange={e => update('cpm', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fixed Price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={form.fixedPrice} onChange={e => update('fixedPrice', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
            </div>
            <div className="space-y-2 flex items-end gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.autoPause} onChange={e => update('autoPause', e.target.checked)} />
                <span className="text-sm">Auto Pause</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.autoResume} onChange={e => update('autoResume', e.target.checked)} />
                <span className="text-sm">Auto Resume</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.autoStop} onChange={e => update('autoStop', e.target.checked)} />
                <span className="text-sm">Auto Stop</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Context</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Product ID</Label>
              <Input value={form.productId} onChange={e => update('productId', e.target.value)} placeholder="For sponsored products" />
            </div>
            <div className="space-y-2">
              <Label>Category ID</Label>
              <Input value={form.categoryId} onChange={e => update('categoryId', e.target.value)} placeholder="For sponsored categories" />
            </div>
            <div className="space-y-2">
              <Label>Keyword</Label>
              <Input value={form.keyword} onChange={e => update('keyword', e.target.value)} placeholder="For search keyword ads" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="For city promotions" />
            </div>
            <div className="space-y-2">
              <Label>Brand ID</Label>
              <Input value={form.brandId} onChange={e => update('brandId', e.target.value)} placeholder="For featured brands" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Targeting</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <select className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTargetType} onChange={e => setNewTargetType(e.target.value as AdTargetType)}>
                <option value="">Type</option>
                {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <Input value={newTargetValue} onChange={e => setNewTargetValue(e.target.value)} placeholder="Value" className="flex-1" />
              <Button type="button" variant="outline" onClick={addTarget}><Plus className="h-4 w-4" /></Button>
            </div>
            {targets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {targets.map((t, i) => (
                  <span key={i} className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full text-sm">
                    {t.targetType}: {t.targetValue}
                    <button type="button" onClick={() => removeTarget(i)} className="text-gray-400 hover:text-white"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/seller/advertising"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Campaign'}</Button>
        </div>
      </form>
    </div>
  );
}
