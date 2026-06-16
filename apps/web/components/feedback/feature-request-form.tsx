'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lightbulb } from 'lucide-react';

interface FeatureRequestData {
  title: string;
  description: string;
  category: string;
  businessImpact: string;
}

interface FeatureRequestFormProps {
  onSubmit: (data: FeatureRequestData) => void;
}

const categories = ['Dashboard', 'Trading', 'Analytics', 'Communication', 'Integration', 'Other'];
const impacts = ['Low', 'Medium', 'High', 'Critical'];

export function FeatureRequestForm({ onSubmit }: FeatureRequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trading');
  const [businessImpact, setBusinessImpact] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({ title, description, category, businessImpact });
    setSubmitting(false);
    setTitle('');
    setDescription('');
    setCategory('Trading');
    setBusinessImpact('Medium');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What feature would you like?" required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the feature and how it helps your workflow..." rows={3} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <Label>Business Impact</Label>
          <select value={businessImpact} onChange={(e) => setBusinessImpact(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
            {impacts.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        <Lightbulb className="mr-2 h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Feature Request'}
      </Button>
    </form>
  );
}
