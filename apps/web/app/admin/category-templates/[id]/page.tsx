'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  getTemplate, updateTemplate, deleteSection, addField, updateField, deleteField,
  addSection, exportTemplateJson,
} from '@/lib/api/category-templates';
import type { CategoryTemplate, TemplateField } from '@/lib/product-onboarding/types';
import {
  Plus, Save, Trash2, GripVertical, ChevronDown, ChevronRight,
  FileJson, Download, Settings,
} from 'lucide-react';

const FIELD_TYPE_OPTIONS = [
  'TEXT', 'TEXTAREA', 'NUMBER', 'PRICE', 'SELECT', 'MULTI_SELECT',
  'CHECKBOX', 'RADIO', 'DATE', 'URL', 'PHONE', 'FILE', 'IMAGE',
  'VIDEO', 'PDF', 'LOCATION', 'RICH_TEXT', 'TAGS', 'JSON',
];

export default function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [template, setTemplate] = useState<CategoryTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState('');
  const [newSectionKey, setNewSectionKey] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  useEffect(() => {
    loadTemplate();
  }, [id]);

  async function loadTemplate() {
    try {
      const data = await getTemplate(id);
      setTemplate(data);
      setName(data.name);
      setExpandedSections(new Set(data.sections.map((s) => s.id)));
    } catch {
      toast({ title: 'Template not found', variant: 'destructive' });
      router.push('/admin/category-templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template) return;
    try {
      const updated = await updateTemplate(template.id, { name });
      setTemplate(updated);
      toast({ title: 'Template saved' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
  }

  async function handleExport() {
    try {
      const data = await exportTemplateJson(template!.id);
      setExportData(JSON.stringify(data, null, 2));
      setShowExport(true);
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  }

  async function handleAddSection() {
    if (!newSectionKey || !newSectionTitle) return;
    try {
      await addSection(template!.id, {
        key: newSectionKey,
        title: newSectionTitle,
        sortOrder: template!.sections.length,
      });
      setNewSectionKey('');
      setNewSectionTitle('');
      loadTemplate();
      toast({ title: 'Section added' });
    } catch {
      toast({ title: 'Failed to add section', variant: 'destructive' });
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('Delete this section and all its fields?')) return;
    try {
      await deleteSection(sectionId);
      loadTemplate();
      toast({ title: 'Section deleted' });
    } catch {
      toast({ title: 'Failed to delete section', variant: 'destructive' });
    }
  }

  async function handleAddField(sectionId: string) {
    const key = prompt('Field key (e.g. shelf-life):');
    if (!key) return;
    const label = prompt('Field label (e.g. Shelf Life):');
    if (!label) return;
    try {
      await addField(sectionId, {
        key, label, type: 'TEXT', sortOrder: 0, isRequired: false,
      });
      loadTemplate();
      toast({ title: `Field "${key}" added` });
    } catch {
      toast({ title: 'Failed to add field', variant: 'destructive' });
    }
  }

  async function handleEditField(field: TemplateField) {
    const newLabel = prompt('Field label:', field.label);
    if (!newLabel || newLabel === field.label) return;
    try {
      await updateField(field.id, { label: newLabel });
      loadTemplate();
    } catch {
      toast({ title: 'Failed to update field', variant: 'destructive' });
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm('Delete this field?')) return;
    try {
      await deleteField(fieldId);
      loadTemplate();
      toast({ title: 'Field deleted' });
    } catch {
      toast({ title: 'Failed to delete field', variant: 'destructive' });
    }
  }

  async function handleToggleFieldRequired(field: TemplateField) {
    try {
      await updateField(field.id, { isRequired: !field.isRequired });
      loadTemplate();
    } catch {
      toast({ title: 'Failed to update field', variant: 'destructive' });
    }
  }

  async function handleChangeFieldType(field: TemplateField, newType: string) {
    try {
      await updateField(field.id, { type: newType });
      loadTemplate();
    } catch {
      toast({ title: 'Failed to update field type', variant: 'destructive' });
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-text-tertiary">Loading template...</div>;
  }

  if (!template) return null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Template Builder"
        description={`Editing: ${template.name} (v${template.version})`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="pt-5">
            <StatusBadge status={template.status === 'ACTIVE' ? 'Active' : template.status === 'DRAFT' ? 'Draft' : 'Archived'} />
          </div>
        </div>
        {template.category && (
          <p className="text-sm text-text-tertiary">Category: {template.category.name}</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Sections & Fields
        </h3>

        <div className="space-y-3">
          {template.sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-border bg-surface-secondary">
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-surface-tertiary/50"
                onClick={() => {
                  const next = new Set(expandedSections);
                  if (next.has(section.id)) next.delete(section.id); else next.add(section.id);
                  setExpandedSections(next);
                }}
              >
                <GripVertical className="h-4 w-4 text-text-tertiary" />
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="h-4 w-4 text-text-tertiary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                )}
                <span className="font-medium text-sm flex-1">{section.title}</span>
                <span className="text-xs text-text-tertiary">{section.fields.length} fields</span>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleAddField(section.id); }}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>

              {expandedSections.has(section.id) && (
                <div className="border-t border-border px-3 pb-3">
                  {section.fields.length === 0 ? (
                    <p className="py-3 text-sm text-text-tertiary text-center">No fields yet. Click + to add one.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {section.fields.map((field) => (
                        <div key={field.id} className="flex items-center gap-2 py-2 text-sm">
                          <GripVertical className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate">{field.label}</span>
                            <span className="ml-2 text-xs text-text-tertiary">{field.key} &middot; {field.type}</span>
                          </div>
                          <select
                            value={field.type}
                            onChange={(e) => handleChangeFieldType(field, e.target.value)}
                            className="text-xs rounded border border-border bg-surface px-1.5 py-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {FIELD_TYPE_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleToggleFieldRequired(field)}
                            className={`text-xs px-1.5 py-0.5 rounded ${field.isRequired ? 'bg-red-100 text-red-700' : 'bg-surface-tertiary text-text-tertiary'}`}
                          >
                            {field.isRequired ? 'Req' : 'Opt'}
                          </button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditField(field)}>
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteField(field.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            placeholder="Section key (e.g. packaging)"
            value={newSectionKey}
            onChange={(e) => setNewSectionKey(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Section title (e.g. Packaging)"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleAddSection} disabled={!newSectionKey || !newSectionTitle}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Section
          </Button>
        </div>
      </div>

      {showExport && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">
              <FileJson className="mr-1.5 h-4 w-4 inline" />
              Exported JSON
            </h3>
            <Button variant="ghost" size="sm" onClick={() => {
              navigator.clipboard.writeText(exportData);
              toast({ title: 'Copied to clipboard' });
            }}>
              Copy
            </Button>
          </div>
          <textarea
            value={exportData}
            readOnly
            className="w-full h-64 rounded-lg border border-border bg-surface-secondary p-3 text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
}
