'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bug } from 'lucide-react';

interface BugReportData {
  title: string;
  description: string;
  category: string;
  priority: string;
  browserInfo: string;
}

interface BugReportFormProps {
  onSubmit: (data: BugReportData) => void;
}

const categories = ['UI', 'Auth', 'Payment', 'RFQ', 'Chat', 'Order', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

export function BugReportForm({ onSubmit }: BugReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  const browserInfo = typeof window !== 'undefined'
    ? JSON.stringify({ userAgent: navigator.userAgent, screen: `${window.innerWidth}x${window.innerHeight}`, url: window.location.href })
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({ title, description, category, priority, browserInfo });
    setSubmitting(false);
    setTitle('');
    setDescription('');
    setCategory('UI');
    setPriority('Medium');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the bug" required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Steps to reproduce, expected vs actual behavior..." rows={3} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <Label>Priority</Label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
            {priorities.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        <Bug className="mr-2 h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Bug Report'}
      </Button>
    </form>
  );
}
