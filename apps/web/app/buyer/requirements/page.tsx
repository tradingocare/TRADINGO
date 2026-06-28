'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRequirementLists, useCreateRequirementList, useDeleteRequirementList } from '@/hooks';
import { Plus, ClipboardList, Trash2, Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function BuyerRequirementsPage() {
  const { data: lists, isLoading } = useRequirementLists();
  const createList = useCreateRequirementList();
  const deleteList = useDeleteRequirementList();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '', priority: 'MEDIUM' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createList.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: '', description: '', deadline: '', priority: 'MEDIUM' }); } });
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'LOW': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardPageHeader title="Requirement Lists" description="Organize your procurement needs" />
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> New List
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="List name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-4">
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-48" />
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm dark:bg-dark-surface dark:border-dark-border">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createList.isPending}>Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><div className="h-24 animate-pulse rounded-lg bg-surface-secondary/50" /></CardContent></Card>
          ))}
        </div>
      ) : !lists?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <ClipboardList className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No requirement lists</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">Create a list to organize products you need to procure.</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Create List</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list: any) => (
            <Card key={list.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{list.name}</CardTitle>
                    {list.description && <p className="mt-1 text-xs text-text-secondary line-clamp-2">{list.description}</p>}
                  </div>
                  <span className={`ml-2 flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${priorityColor(list.priority)}`}>
                    {list.priority}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" /> {list._count?.items ?? 0} items</span>
                  {list.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(list.deadline).toLocaleDateString('en-IN')}</span>}
                </div>
                {list.items?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {list.items.slice(0, expandedId === list.id ? undefined : 3).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-surface-secondary/50 px-3 py-1.5 text-xs dark:bg-dark-surface-secondary/50">
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-text-secondary">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                    {list.items.length > 3 && (
                      <button onClick={() => setExpandedId(expandedId === list.id ? null : list.id)}
                        className="flex w-full items-center justify-center gap-1 py-1 text-xs text-[#FF5A1F] hover:text-[#FF4D00]">
                        {expandedId === list.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expandedId === list.id ? 'Show less' : `${list.items.length - 3} more items`}
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 dark:border-dark-border">
                  <Button variant="outline" size="sm" onClick={() => deleteList.mutate(list.id)} className="text-red-500">
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${list.status === 'ACTIVE' ? 'text-green-500' : 'text-text-tertiary'}`}>
                    {list.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
