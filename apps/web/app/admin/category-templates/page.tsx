'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, FileJson, Upload, Eye, Copy, Trash2, CheckCircle, Archive } from 'lucide-react';
import { getTemplates, deleteTemplate, duplicateTemplate, activateTemplate } from '@/lib/api/category-templates';
import type { CategoryTemplate } from '@/lib/product-onboarding/types';

export default function AdminCategoryTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CategoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (e) {
      toast({ title: 'Failed to load templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteTemplate(id);
      toast({ title: 'Template deleted' });
      loadTemplates();
    } catch (e) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateTemplate(id);
      toast({ title: 'Template duplicated' });
      loadTemplates();
    } catch (e) {
      toast({ title: 'Failed to duplicate', variant: 'destructive' });
    }
  }

  async function handleActivate(id: string) {
    try {
      await activateTemplate(id);
      toast({ title: 'Template activated' });
      loadTemplates();
    } catch (e) {
      toast({ title: 'Failed to activate', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Category Templates"
        description="Manage dynamic product onboarding forms per category"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(!showImport)}>
              <FileJson className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
            <Button onClick={() => router.push('/admin/category-templates/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        }
      />

      {showImport && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <h3 className="font-medium text-sm">Import Template from JSON</h3>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste JSON here..."
            className="w-full h-32 rounded-lg border border-border bg-surface-secondary p-3 text-xs font-mono"
          />
          <Button size="sm" onClick={async () => {
            try {
              const data = JSON.parse(importJson);
              toast({ title: 'Use the import API with a valid category ID' });
            } catch {
              toast({ title: 'Invalid JSON', variant: 'destructive' });
            }
          }}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary p-12 text-center">
          <Archive className="mb-3 h-12 w-12 text-text-tertiary" />
          <h3 className="text-lg font-medium text-text-primary">No templates yet</h3>
          <p className="mt-1 text-sm text-text-tertiary">Create your first category template to get started.</p>
          <Button className="mt-4" onClick={() => router.push('/admin/category-templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-lg border border-border bg-surface p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/category-templates/${tpl.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={tpl.status === 'ACTIVE' ? 'Active' : tpl.status === 'DRAFT' ? 'Draft' : 'Archived'} />
                <span className="text-xs text-text-tertiary">v{tpl.version}</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{tpl.name}</h3>
              <p className="text-sm text-text-tertiary mb-3">
                {tpl.category?.name || 'Uncategorized'} &middot; {tpl._count?.sections ?? 0} sections
              </p>
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/category-templates/${tpl.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(tpl.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                {tpl.status !== 'ACTIVE' && (
                  <Button variant="ghost" size="sm" onClick={() => handleActivate(tpl.id)}>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(tpl.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
