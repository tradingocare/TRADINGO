'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { Plus, FileText, Copy, Edit2, Trash2, Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RfqTemplate {
  id: string;
  name: string;
  product: string;
  category: string;
  lastUsed: string;
  status: string;
}

export default function RfqTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<RfqTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await apiClient.get('/seller/rfq-templates');
      const list = res.data?.data || res.data || [];
      setTemplates(Array.isArray(list) ? list : []);
    } catch {
      setError('Failed to load RFQ templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/seller/rfq-templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'Template deleted' });
    } catch {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const handleUse = (template: RfqTemplate) => {
    router.push(`/seller/rfq/new?templateId=${template.id}`);
  };

  const handleCreate = () => {
    router.push('/seller/rfq/new?createTemplate=true');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Templates" description="Manage your saved RFQ templates for quick responses" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="RFQ Templates"
          description="Manage your saved RFQ templates for quick responses"
          actions={<Button onClick={fetchTemplates}><Plus className="mr-2 h-4 w-4" /> Retry</Button>}
        />
        <EmptyState icon={FileText} variant="error" title="Failed to load templates" description={error} action={<Button onClick={fetchTemplates}>Try Again</Button>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="RFQ Templates"
        description="Manage your saved RFQ templates for quick responses"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState icon={FileText} title="No templates yet" description="Create your first RFQ template to respond to buyer requests faster." action={<Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Create Template</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <StatusBadge status={template.status} />
                </div>
                <CardDescription>{template.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary dark:text-dark-text-secondary">Product</span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{template.product}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <Clock className="h-3 w-3" />
                    Last used: {template.lastUsed}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t border-border pt-4 dark:border-dark-border">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleUse(template)}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Use
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push(`/seller/rfq/new?editTemplateId=${template.id}`)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} disabled={deleting === template.id}>
                  {deleting === template.id ? <LoadingSpinner size="xs" /> : <Trash2 className="h-3.5 w-3.5 text-red-500" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
