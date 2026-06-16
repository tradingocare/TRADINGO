'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, Copy, Edit2, Trash2, Clock } from 'lucide-react';

interface RfqTemplate {
  id: string;
  name: string;
  product: string;
  category: string;
  lastUsed: string;
  status: string;
}

const initialTemplates: RfqTemplate[] = [
  { id: '1', name: 'Standard Electronics RFQ', product: 'Circuit Boards', category: 'Electronics', lastUsed: '2026-06-10', status: 'active' },
  { id: '2', name: 'Textile Bulk Order', product: 'Cotton Fabric', category: 'Textiles', lastUsed: '2026-06-08', status: 'active' },
  { id: '3', name: 'Food Grade Packaging', product: 'Plastic Containers', category: 'Packaging', lastUsed: '2026-05-28', status: 'draft' },
  { id: '4', name: 'Industrial Chemicals', product: 'Sodium Hydroxide', category: 'Chemicals', lastUsed: '2026-05-15', status: 'active' },
];

export default function RfqTemplatesPage() {
  const [templates, setTemplates] = useState(initialTemplates);

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="RFQ Templates"
        description="Manage your saved RFQ templates for quick responses"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <FileText className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No templates yet</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            Create your first RFQ template to respond to buyer requests faster.
          </p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
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
                <Button variant="outline" size="sm" className="flex-1">
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Use
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
